// admin/users/approveUser.js
import { config } from 'dotenv';
import { updateUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/users/approveUser.js';

export async function adminApproveUser(body) {
    console.log('adminApproveUser called with:', body);
    // Get userId from the request body (from URL parameter)
    const targetUserId = body.userId; // This should be from URL params, not admin's userId
    const requestId = body.requestId;
    delete body.requestId;
    // Don't delete userId here, we need it!
    
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
                    message: 'Valid user ID is required.'
                }
            };
        }

        const updateData = {
            email_verified_at: isApproved ? new Date() : null,
            consented_at: isApproved ? new Date() : null
        };

        const updateUserResponse = await updateUser(
            { id: targetUserId, deleted_at: null }, // Use targetUserId here
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
            userId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update user approval.',
            }
        };
    }
}
