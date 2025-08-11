import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import { getUser } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { getBooking, updateBooking } from "./crud.js";
import { BOOKING_STATUSES } from "../helper/constants.js";
import { updateBookingValidation } from "../joi/validation.js";

const FILE_NAME = 'update.js';

// Helper function to verify admin JWT token
export async function updateBookingAPI(body) {
    
    const userId = body.userId;
    delete body.userId;
    const requestId = body.requestId;
    delete body.requestId;
    const isAdminOverride = body.adminOverride || false;
    delete body.adminOverride;
    const adminNote = body.adminNote || '';
    delete body.adminNote;
    
    try {
        
        // For admin routes, userId will be "admin" (from token)
        // For regular routes, userId will be a numeric user ID
        const isAdminUser = userId === 'admin' || isAdminOverride;
        
        // Skip validation for admin users
        if (!isAdminUser) {
            const { headerError, bodyError } = updateBookingValidation(body);
            if (headerError || bodyError) {
                return {
                    statusCode: 400,
                    body: {
                        message: 'Oops! Something went wrong.',
                        error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                    }
                }
            }
        }

        // For non-admin users, validate they exist
        let userData = null;
        if (!isAdminUser) {
            const userDataFromDB = await getUser(
                { 
                    id: userId,
                    deleted_at: null
                },
                null,
                ['id', 'email'],
                requestId
            );
            
            if (userDataFromDB.error) {
                return userDataFromDB.errorData;
            }
            
            userData = userDataFromDB.data.user;
        }

        // For admin: fetch any booking by ID
        // For users: only allow their own bookings
        const bookingQuery = isAdminUser ? 
            { id: body.bookingId } :
            {
                id: body.bookingId,
                [Op.or]: {
                    creator_id: userData.id,
                    participant_id: userData.id
                }
            };

        const existingBooking = await getBooking(
            bookingQuery,
            ['id', 'creator_id', 'participant_id', 'status', 'start_time', 'end_time'],
            requestId
        );
        
        if (existingBooking.error) {
            return existingBooking.errorData;
        }
        
        const bookingData = existingBooking.data.booking;

        // Role-based permissions (skip for admin)
        if (!isAdminUser) {
            if (bookingData.participant_id === userData.id) {
                // Participant can only DECLINE or SCHEDULE (accept)
                if (![BOOKING_STATUSES.DECLINED, BOOKING_STATUSES.SCHEDULED].includes(body.status)) {
                    return {
                        statusCode: 400,
                        body: {
                            message: 'Invalid operation for participant. You can only accept (schedule) or decline meetings.'
                        }
                    }
                }
            } else if (bookingData.creator_id === userData.id) {
                // Creator can only CANCEL
                if (BOOKING_STATUSES.CANCELLED !== body.status) {
                    return {
                        statusCode: 400,
                        body: {
                            message: 'Invalid operation for creator. You can only cancel meetings.'
                        }
                    }
                }
            }
        } else {
            // Admin: validate status exists
            const validStatuses = Object.values(BOOKING_STATUSES);
            if (!validStatuses.includes(body.status)) {
                return {
                    statusCode: 400,
                    body: {
                        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                    }
                }
            }
        }

        // Prepare update data
        const updateData = {
            status: body.status
        };

        // Add admin-specific fields if admin override
        if (isAdminUser) {
            updateData.admin_updated = true;
            updateData.admin_note = adminNote;
            updateData.updated_by_admin_email = 'admin@outlaw.com'; // or extract from token
            updateData.admin_updated_at = new Date();
        }

        const updateBookingResponse = await updateBooking(
            {
                id: body.bookingId 
            },
            updateData,
            requestId
        );
        
        if (updateBookingResponse.error) {
            return updateBookingResponse.errorData;
        }

        // Log admin actions for audit trail
        if (isAdminUser) {
            logger.info(FILE_NAME, 'updateBookingAPI', requestId, {
                action: 'admin_booking_update_success',
                adminEmail: 'admin@outlaw.com',
                bookingId: body.bookingId,
                oldStatus: bookingData.status,
                newStatus: body.status,
                adminNote: adminNote,
                creatorId: bookingData.creator_id,
                participantId: bookingData.participant_id,
                timestamp: new Date().toISOString()
            });
        }

        return {
            statusCode: 200,
            body: {
                message: isAdminUser ? 
                    'Booking updated by admin successfully!' : 
                    'Booking status updated!',
                data: {
                    bookingId: body.bookingId,
                    oldStatus: bookingData.status,
                    newStatus: body.status,
                    adminUpdated: isAdminUser,
                    adminNote: isAdminUser ? adminNote : undefined,
                    updatedBy: isAdminUser ? 'admin@outlaw.com' : userData?.email
                }
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'updateBookingAPI', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            isAdminOverride: isAdminUser,
            bookingId: body.bookingId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Unable to update booking!'
            }
        }
    }
}