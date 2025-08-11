// backend/src/ADMIN/users/getUserDetails.js
import { config } from 'dotenv';
import { getUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';
import { UserInformation } from '../db/pool.js';

config();
const FILE_NAME = 'admin/users/getUserDetails.js';

export async function adminGetUserDetails(body) {
    const userId = body.userId; // From URL parameter or body
    const requestId = body.requestId;
    delete body.requestId;
    delete body.userId;
    
    try {
        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid user ID'
                }
            };
        }
        
        // Fetch user with full profile information
        const userResponse = await getUser(
            { 
                id: userId,
                deleted_at: null 
            },
            [{
                model: UserInformation,
                as: 'user_information',
                required: false,
                attributes: [
                    'name', 'linkedin', 'github', 'industry', 'country',
                    'experience', 'avatar', 'profile_title', 'available_time_slots',
                    'cv_url', 'age', 'description', 'gender', 'linkedin_profile_data'
                ]
            }],
            [
                'id', 'email', 'temp_id', 'auth_type', 'persona_type',
                'created_at', 'updated_at', 'verified_by_admin', 'email_verified_at'
            ],
            requestId
        );
        
        if (userResponse.error) {
            return {
                statusCode: 404,
                body: {
                    message: 'User not found'
                }
            };
        }
        
        const user = userResponse.data.user;
        const userInfo = user.user_information;
        
        // Build user details object
        const userDetails = {
            // Core user fields
            id: user.id,
            email: user.email,
            temp_id: user.temp_id,
            auth_type: user.auth_type,
            persona_type: user.persona_type,
            created_at: user.created_at,
            updated_at: user.updated_at,
            verified_by_admin: !!user.email_verified_at, // Convert to boolean for frontend compatibility
            email_verified_at: user.email_verified_at,
            
            // Profile fields (with null fallbacks)
            name: userInfo?.name || null,
            linkedin: userInfo?.linkedin || null,
            github: userInfo?.github || null,
            industry: userInfo?.industry || null,
            country: userInfo?.country || null,
            experience: userInfo?.experience || null,
            avatar: userInfo?.avatar || null,
            profile_title: userInfo?.profile_title || null,
            cv_url: userInfo?.cv_url || null,
            age: userInfo?.age || null,
            description: userInfo?.description || null,
            gender: userInfo?.gender || null,
            
            // JSON fields (safely parsed)
            available_time_slots: null,
            linkedin_profile_data: null
        };
        
        // Safely parse JSON fields
        const jsonFields = ['available_time_slots', 'linkedin_profile_data'];
        jsonFields.forEach(field => {
            const rawValue = userInfo?.[field];
            if (rawValue) {
                try {
                    if (typeof rawValue === 'string') {
                        userDetails[field] = JSON.parse(rawValue);
                    } else {
                        userDetails[field] = rawValue; // Already parsed by Sequelize
                    }
                } catch (error) {
                    logger.warn(FILE_NAME, 'adminGetUserDetails', requestId, {
                        message: `Failed to parse ${field}`,
                        userId,
                        rawValue,
                        error: error.message
                    });
                    userDetails[field] = rawValue; // Keep original if parsing fails
                }
            }
        });
        
        logger.info(FILE_NAME, 'adminGetUserDetails', requestId, {
            message: 'User details retrieved successfully',
            userId
        });
        
        return {
            statusCode: 200,
            body: {
                message: 'User details retrieved successfully',
                user: userDetails
            }
        };
        
    } catch (error) {
        logger.error(FILE_NAME, 'adminGetUserDetails', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            userId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to fetch user details.'
            }
        };
    }
}

// Alternative version using direct database query (if you prefer raw SQL)
export async function adminGetUserDetailsRaw(body) {
    const userId = body.userId;
    const requestId = body.requestId;
    delete body.requestId;
    delete body.userId;
    
    try {
        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid user ID'
                }
            };
        }
        
        // Import Sequelize connection for raw queries
        const { sequelize } = await import('../../db/pool.js');
        
        const query = `
            SELECT 
                u.id, u.email, u.temp_id, u.auth_type, u.persona_type,
                u.created_at, u.updated_at, u.verified_by_admin, u.email_verified_at,
                ui.name, ui.linkedin, ui.github, ui.industry, ui.country,
                ui.experience, ui.avatar, ui.profile_title, ui.available_time_slots,
                ui.cv_url, ui.age, ui.description, ui.gender, ui.linkedin_profile_data
            FROM users u
            LEFT JOIN user_information ui ON u.id = ui.user_id
            WHERE u.id = :userId AND u.deleted_at IS NULL
        `;
        
        const [results] = await sequelize.query(query, {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT
        });
        
        if (!results || results.length === 0) {
            return {
                statusCode: 404,
                body: {
                    message: 'User not found'
                }
            };
        }
        
        const userDetails = results[0];
        
        // Convert verified_by_admin to boolean for frontend compatibility
        userDetails.verified_by_admin = !!userDetails.email_verified_at;
        
        // Safely parse JSON fields
        const jsonFields = ['available_time_slots', 'linkedin_profile_data'];
        jsonFields.forEach(field => {
            if (userDetails[field]) {
                try {
                    userDetails[field] = JSON.parse(userDetails[field]);
                } catch (error) {
                    logger.warn(FILE_NAME, 'adminGetUserDetailsRaw', requestId, {
                        message: `Failed to parse ${field}`,
                        userId,
                        error: error.message
                    });
                    // Keep original string if JSON parse fails
                }
            }
        });
        
        return {
            statusCode: 200,
            body: {
                message: 'User details retrieved successfully',
                user: userDetails
            }
        };
        
    } catch (error) {
        logger.error(FILE_NAME, 'adminGetUserDetailsRaw', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            userId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to fetch user details.'
            }
        };
    }
}