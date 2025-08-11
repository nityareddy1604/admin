import {Op} from 'sequelize';
import {createBooking} from "../booking/crud.js";
import {getUsers} from "../user/crud.js";
import {getIdea} from "../idea/crud.js";
import {logger} from "../logger/logger.js";
import {sendMailWithAPI} from "../helper/AWS/ses.js";
import {DynamoDBClient, PutItemCommand, GetItemCommand} from "@aws-sdk/client-dynamodb";
import {meetingSummaryAxiosInstance} from "../helper/axiosInstance.js";
import {USER_ROLES} from "../helper/constants.js";

const dynamoClient = new DynamoDBClient({region: process.env.AWS_REGION});

const FILE_NAME = "admin/create.js";

function formatDateTime(isoString) {
    return new Date(isoString).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });
}

export async function createBookingAdmin(body) {
    const requestId = body.requestId;
    delete body.requestId;

    try {
        const {creatorId, participantId, startTime, endTime} = body;

        // Fetch attendees from users table using creator_id and participant_id
        const userIds = [creatorId, participantId];
        const usersResult = await getUsers({id: userIds}, null, null, requestId);

        if (usersResult.error) {
            return usersResult.errorData;
        }

        if (!usersResult.error && usersResult.data?.users) {
            if (usersResult.data?.users.length !== 2) {
                throw new Error("Meeting Cant be generated");
            }
        }

        const users = JSON.parse(JSON.stringify(usersResult));
        const founderUser = users.data.users.find(u => u.persona_type === USER_ROLES.FOUNDER);
        const smeUser = users.data.users.find(u => u.persona_type === USER_ROLES.SME);

        // TODO: In future, idea_id will come from UI
        // For now, fetch founder's first idea
        const founderIdeaResult = await getIdea(
            {
                user_id: founderUser.id,
                idea_capture: {[Op.ne]: null}
            },
            null,
            null,
            [['created_at', 'DESC']],
            requestId
        );

        if (founderIdeaResult.error || !founderIdeaResult.data.idea) {
            return {
                statusCode: 404,
                body: {
                    message: "No idea found for founder. Meeting cannot be scheduled."
                }
            };
        }

        // Create new booking
        const bookingData = {
            creator_id: creatorId,
            participant_id: participantId,
            start_time: startTime,
            end_time: endTime,
            status: "scheduled",
        };

        const bookingResponse = await createBooking(bookingData, requestId);
        if (bookingResponse.error) {
            throw new Error("Failed to create booking with meeting details");
        }
        try {
            const founderIdea = founderIdeaResult.data.idea;

            // Create composite key for DynamoDB
            const meetingCompositeKey = `USER${creatorId}#MEETING${founderIdea.ai_request_id}`;
            const existingData = await dynamoClient.send(new GetItemCommand({
                TableName: "meeting_summary",
                Key: {
                    ai_request_id: {S: founderIdea.ai_request_id},
                    composite: {S: meetingCompositeKey}
                }
            }));
            let meetingPrepData;

            if (existingData.Item) {
                // Parse the summary data from DynamoDB
                meetingPrepData = JSON.parse(existingData.Item.summary.S);

            } else {
                const aiPayload = {
                    request_id: founderIdea.ai_request_id,
                    user_id: creatorId.toString(),
                    persona_type: "SME",
                    meeting_id: `meeting-${bookingResponse.data.bookingResponse.id}`
                };
                const meetingPrepResponse = await meetingSummaryAxiosInstance.post("/meeting-prep", aiPayload);
                meetingPrepData = meetingPrepResponse.data;

                if (meetingPrepData) {
                    await dynamoClient.send(new PutItemCommand({
                        TableName: "meeting_summary",
                        Item: {
                            ai_request_id: {S: founderIdea.ai_request_id},
                            composite: {S: meetingCompositeKey},
                            summary: {S: JSON.stringify(meetingPrepData)}
                        }
                    }));
                }

            }

            // Extract bullet points from meeting prep data
            const {founder_bullet_points, sme_bullet_points} = meetingPrepData;

            // Validate that we have the required data
            if (!founder_bullet_points || !sme_bullet_points) {
                throw new Error("Meeting prep data missing required bullet points");
            }

            // Send email to SME user
            if (smeUser) {
                try {
                    await sendMailWithAPI({
                        to: smeUser.email,
                        subject: "Meeting Preparation Guide - SME",
                        html: `
                            <p>Your meeting is scheduled for <strong>${formatDateTime(
                            startTime
                        )}</strong></p>
                            ${sme_bullet_points.replace(/\n/g, "<br>")}
                        `,
                        text: `Meeting Preparation Guide\n\nYour meeting is scheduled for ${formatDateTime(
                            startTime
                        )}\n\n${sme_bullet_points}`,
                        requestId,
                    });
                    logger.info(FILE_NAME, "createBookingAdmin", requestId, {
                        message: "SME email sent successfully",
                        email: smeUser.email,
                    });
                } catch (emailError) {
                    logger.error(FILE_NAME, "createBookingAdmin", requestId, {
                        error: emailError,
                        message: "Failed to send SME email",
                    });
                }
            }

            // Send email to Founder user
            if (founderUser) {
                try {
                    await sendMailWithAPI({
                        to: founderUser.email,
                        subject: "Meeting Preparation Guide - Founder",
                        html: `
                            <p>Your meeting is scheduled for <strong>${formatDateTime(
                            startTime
                        )}</strong></p>
                            ${founder_bullet_points.replace(/\n/g, "<br>")}
                        `,
                        text: `Meeting Preparation Guide\n\nYour meeting is scheduled for ${formatDateTime(
                            startTime
                        )}\n\n${founder_bullet_points}`,
                        requestId,
                    });
                    logger.info(FILE_NAME, "createBookingAdmin", requestId, {
                        message: "Founder email sent successfully",
                        email: founderUser.email,
                    });
                } catch (emailError) {
                    logger.error(FILE_NAME, "createBookingAdmin", requestId, {
                        error: emailError,
                        message: "Failed to send founder email",
                    });
                }
            }
        } catch (error) {
            logger.error(FILE_NAME, "createBookingAdmin", requestId, {
                error: error.response?.data || error.message,
                status: error.response?.status,
                message: "Meeting prep API call failed",
            });
        }

        return {
            statusCode: 200,
            body: bookingResponse,
        };
    } catch (error) {
        logger.error(FILE_NAME, "createBookingAdmin", requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
        });
        return {
            statusCode: 500,
            body: {
                message: "Could not create meeting",
            },
        };
    }
}