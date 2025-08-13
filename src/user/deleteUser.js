// admin/users/deleteUser.js
import { config } from 'dotenv';
import { updateUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/users/deleteUser.js';

export async function adminDeleteUser(body) {
    const targetUserId = body.targetUserId; // Changed from body.userId to body.targetUserId
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        if (!targetUserId) {
            return {
                statusCode: 400,
                body: {
                    message: 'targetUserId is required.'
                }
            };
        }

        const updateData = {
            deleted_at: new Date()
        };

        const deleteUserResponse = await updateUser(
            { id: targetUserId, deleted_at: null },
            updateData,
            requestId
        );
        
        if (deleteUserResponse.error) {
            return deleteUserResponse.errorData;
        }

        return {
            statusCode: 200,
            body: {
                message: 'User deleted successfully',
                deleted_user_id: targetUserId
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'adminDeleteUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            targetUserId // Changed from userId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to delete user.',
            }
        };
    }
}