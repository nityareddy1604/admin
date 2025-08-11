import { Op } from "sequelize";
import { config } from "dotenv";
import { getBookings } from "./crud.js";
import { getUser } from "../user/crud.js";
import { logger } from "../logger/logger.js";
import { UserInformation } from "../db/pool.js";
import { BOOKING_STATUSES } from "../helper/constants.js";
import { getWorkingHours } from "../helper/helper.js";
config();

const MAX_BOOKED_TILL_IN_DAYS = +process.env.MAX_BOOKED_TILL_IN_DAYS || 3;
const FILE_NAME = 'getAvailableSlots.js';

function getTimeStampForDataBase(timestamp) {
    return new Date(timestamp);
}

export async function getAvailableSlots(body) {
    
    // Handle both targetUserId (for admin requests) and userId (for regular requests)
    const userId = body.targetUserId || body.userId;
    delete body.targetUserId;
    delete body.userId;

    const requestId = body.requestId;
    delete body.requestId;
    
    // Add validation for userId
    if (!userId) {
        return {
            statusCode: 400,
            body: {
                message: 'userId or targetUserId is required'
            }
        };
    }
    
    try {
        
        const usersDataFromDB = await getUser(
            { 
                id: userId,
                deleted_at: null
            },
            [
                {
                    model: UserInformation,
                    as: 'user_information',
                    attributes: ['available_time_slots'],
                }
            ],
            ['id', 'email'],
            requestId
        );
    
        if (usersDataFromDB.error) {
            return usersDataFromDB.errorData;
        }
    
        const usersData = usersDataFromDB.data.user;
        const usersWorkingHours = getWorkingHours(usersData.user_information.available_time_slots, requestId);
    
        const availableSlots = [];
        const minSlotsCount = MAX_BOOKED_TILL_IN_DAYS >= 7 ? MAX_BOOKED_TILL_IN_DAYS : Math.min(MAX_BOOKED_TILL_IN_DAYS, usersWorkingHours.length);
        const now = new Date();
    
        // Generate available slots for next few days
        for (let i = 0; i < minSlotsCount; i++) {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + i);
            const dayOfWeek = targetDate.getDay();
            
            for (const workingHoursObj of usersWorkingHours) {
                if (workingHoursObj.day === dayOfWeek) {
                    availableSlots.push({
                        ...workingHoursObj,
                        date: targetDate.toISOString().split('T')[0]
                    });
                }
            }
        }
    
        if (!availableSlots.length) {
            return {
                statusCode: 200,
                body: {
                    availableSlots: []
                }
            }
        }
    
        const startTimeForDB = getTimeStampForDataBase(now.getTime());
        const endTimeForDB = getTimeStampForDataBase(now.getTime() + MAX_BOOKED_TILL_IN_DAYS * 24 * 60 * 60 * 1000);
    
        const existingBookings = await getBookings(
            {
                [Op.or]: {
                    creator_id: userId,
                    participant_id: userId
                },
                start_time: {
                    [Op.gte]: startTimeForDB
                },
                end_time: {
                    [Op.lte]: endTimeForDB
                },
                status: [BOOKING_STATUSES.ONGOING, BOOKING_STATUSES.SCHEDULED, BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.PENDING]
            },
            requestId
        );

        if (existingBookings.error) {
            if (existingBookings.errorData.statusCode === 404) {
                return {
                    statusCode: 200,
                    body: {
                        availableSlots
                    }
                }
            }
            return existingBookings.errorData;
        }

        const bookings = existingBookings.data.bookings;
    
        // Filter out conflicting times
        const filteredSlots = availableSlots.map(slot => {
            const filteredTimes = slot.times.filter(timeSlot => {
                return !bookings.some(booking => {
                    const bookingStart = new Date(booking.start_time);
                    const bookingEnd = new Date(booking.end_time);
                    const bookingDay = bookingStart.getDay();
                    
                    if (bookingDay !== slot.day) return false;
                    
                    const slotStartMinutes = timeSlot.startTime.hours * 60 + timeSlot.startTime.minutes;
                    const slotEndMinutes = timeSlot.endTime.hours * 60 + timeSlot.endTime.minutes;
                    const bookingStartMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
                    const bookingEndMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
                    
                    return (slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes);
                });
            });
            
            return {
                ...slot,
                times: filteredTimes
            };
        }).filter(slot => slot.times.length > 0);
    
        return {
            statusCode: 200,
            body: {
                availableSlots: filteredSlots,
                totalSlots: filteredSlots.reduce((sum, slot) => sum + slot.times.length, 0)
            }
        }
    } catch (error) {
        logger.error(FILE_NAME, 'getAvailableSlots', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Cannot fetch users available slots!'
            }
        }
    }
}