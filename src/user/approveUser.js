// admin/users/approveUser.js
import { config } from 'dotenv';
import { updateUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/users/approveUser.js';

export async function adminApproveUser(body) {
    console.log('adminApproveUser called with:', body);
    
    // Get targetUserId from the request body instead of userId
    const targetUserId = body.targetUserId; // Changed from body.userId to body.targetUserId
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { isApproved } = body;
        
        if (typeof isApproved !== 'boolean') {
            return {
                statusCode: 400,
                body: {
                    message: 'isApproved must be a boolean value.'
                }
            };
        }

        if (!targetUserId || targetUserId === 'admin') {
            return {
                statusCode: 400,
                body: {
                    message: 'Valid targetUserId is required.'
                }
            };
        }

        const updateData = {
            email_verified_at: isApproved ? new Date() : null,
            consented_at: isApproved ? new Date() : null
        };

        const updateUserResponse = await updateUser(
            { id: targetUserId, deleted_at: null },
            updateData,
            requestId
        );

        if (updateUserResponse.error) {
            return updateUserResponse.errorData;
        }

        return {
            statusCode: 200,
            body: {
                message: `User ${isApproved ? 'approved' : 'approval revoked'} successfully`,
                user: updateUserResponse.data.userResponse
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'adminApproveUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            targetUserId // Changed from userId to targetUserId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update user approval.',
            }
        };
    }
}