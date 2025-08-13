import { config } from 'dotenv';
import { getBooking, updateBooking } from '../booking/crud.js';
import { getUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/booking/editBooking.js';

export async function adminEditBooking(body) {
    const { bookingId, creator_id, participant_id, start_time, end_time, requestId } = body;
    delete body.requestId;
    
    try {
        // Validate required fields
        if (!bookingId) {
            return {
                statusCode: 400,
                body: {
                    message: 'bookingId is required'
                }
            };
        }

        // Check if booking exists
        const existingBookingResponse = await getBooking(
            { id: bookingId },
            ['id', 'creator_id', 'participant_id', 'start_time', 'end_time', 'status'],
            requestId
        );

        if (existingBookingResponse.error) {
            return existingBookingResponse.errorData;
        }

        const existingBooking = existingBookingResponse.data.booking;

        // Prepare update data
        const updateData = {};

        // Validate and add creator_id if provided
        if (creator_id !== undefined) {
            if (creator_id === participant_id) {
                return {
                    statusCode: 400,
                    body: {
                        message: 'Creator and participant must be different users'
                    }
                };
            }

            // Verify creator exists
            const creatorCheck = await getUser({ id: creator_id }, null, ['id'], requestId);
            if (creatorCheck.error) {
                return {
                    statusCode: 404,
                    body: {
                        message: 'Creator not found'
                    }
                };
            }
            updateData.creator_id = creator_id;
        }

        // Validate and add participant_id if provided
        if (participant_id !== undefined) {
            if (creator_id === participant_id) {
                return {
                    statusCode: 400,
                    body: {
                        message: 'Creator and participant must be different users'
                    }
                };
            }

            // Verify participant exists
            const participantCheck = await getUser({ id: participant_id }, null, ['id'], requestId);
            if (participantCheck.error) {
                return {
                    statusCode: 404,
                    body: {
                        message: 'Participant not found'
                    }
                };
            }
            updateData.participant_id = participant_id;
        }

        // Add optional time fields if provided
        if (start_time !== undefined) {
            updateData.start_time = new Date(start_time);
        }
        if (end_time !== undefined) {
            updateData.end_time = new Date(end_time);
        }

        // Get current values for validation (use new values if provided, otherwise existing)
        const currentCreatorId = updateData.creator_id || existingBooking.creator_id;
        const currentParticipantId = updateData.participant_id || existingBooking.participant_id;
        const currentStartTime = updateData.start_time || new Date(existingBooking.start_time);
        const currentEndTime = updateData.end_time || new Date(existingBooking.end_time);

        // Validate that creator and participant are different (final check)
        if (currentCreatorId === currentParticipantId) {
            return {
                statusCode: 400,
                body: {
                    message: 'Creator and participant must be different users'
                }
            };
        }

        // Validate time logic
        if (currentStartTime >= currentEndTime) {
            return {
                statusCode: 400,
                body: {
                    message: 'End time must be after start time'
                }
            };
        }

        // Validate start time is not in the past (optional - remove if you want to allow past bookings)
        // if (currentStartTime < new Date()) {
        //     return {
        //         statusCode: 400,
        //         body: {
        //             message: 'Start time cannot be in the past'
        //         }
        //     };
        // }

        // Update the booking
        const updateResponse = await updateBooking(
            { id: bookingId },
            updateData,
            requestId
        );

        if (updateResponse.error) {
            return updateResponse.errorData;
        }

        logger.info(FILE_NAME, 'adminEditBooking', requestId, {
            bookingId,
            updatedFields: Object.keys(updateData),
            changes: {
                creator_id: creator_id !== undefined ? { from: existingBooking.creator_id, to: creator_id } : 'unchanged',
                participant_id: participant_id !== undefined ? { from: existingBooking.participant_id, to: participant_id } : 'unchanged',
                start_time: start_time !== undefined ? { from: existingBooking.start_time, to: start_time } : 'unchanged',
                end_time: end_time !== undefined ? { from: existingBooking.end_time, to: end_time } : 'unchanged'
            },
            message: 'Booking updated successfully'
        });

        return {
            statusCode: 200,
            body: {
                message: 'Booking updated successfully',
                booking: updateResponse.data.booking,
                updatedFields: Object.keys(updateData)
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'adminEditBooking', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            bookingId,
            requestedChanges: {
                creator_id,
                participant_id,
                start_time,
                end_time
            }
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update booking'
            }
        };
    }
}