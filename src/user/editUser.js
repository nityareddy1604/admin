// backend/src/ADMIN/users/editUser.js
import { config } from 'dotenv';
import { updateUser, getUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';
import { UserInformation } from '../db/pool.js';
import { USER_ROLES } from '../helper/constants.js';

config();
const FILE_NAME = 'admin/users/editUser.js';

export async function adminEditUser(body) {
    const userId = body.userId; // From URL parameter
    const requestId = body.requestId;
    delete body.requestId;
    delete body.userId;
    
    try {
        if (!userId) {
            return {
                statusCode: 400,
                body: {
                    message: 'User ID is required.'
                }
            };
        }
        
        // Extract fields from request body
        const {
            // Core user fields
            email,
            persona_type,
            email_verified_at,
            verified_by_admin,
            
            // Profile fields
            name,
            profile_title,
            country,
            industry,
            age,
            linkedin,
            github,
            experience,
            description,
            gender
        } = body;
        
        // Validate persona_type if provided
        if (persona_type && !Object.values(USER_ROLES).includes(persona_type)) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid persona_type. Must be one of: founder, sme, respondent, not_selected'
                }
            };
        }
        
        // Validate age if provided
        if (age !== undefined && (age < 13 || age > 120)) {
            return {
                statusCode: 400,
                body: {
                    message: 'Age must be between 13 and 120'
                }
            };
        }
        
        // Check if user exists
        const existingUserResponse = await getUser(
            { id: userId, deleted_at: null },
            [{
                model: UserInformation,
                as: 'user_information',
                required: false
            }],
            null,
            requestId
        );
        
        if (existingUserResponse.error) {
            return {
                statusCode: 404,
                body: {
                    message: 'User not found or has been deleted.'
                }
            };
        }
        
        const existingUser = existingUserResponse.data.user;
        
        // Prepare user table updates
        const userUpdates = {};
        if (email !== undefined) userUpdates.email = email;
        if (persona_type !== undefined) userUpdates.persona_type = persona_type;
        
        // Handle verification fields - convert boolean to timestamp
        if (email_verified_at !== undefined) {
            userUpdates.email_verified_at = email_verified_at ? new Date() : null;
        }
        if (verified_by_admin !== undefined) {
            // For backward compatibility, treat verified_by_admin as email verification
            userUpdates.email_verified_at = verified_by_admin ? new Date() : null;
            userUpdates.consented_at = verified_by_admin ? new Date() : null;
        }
        
        // Update user table if there are changes
        if (Object.keys(userUpdates).length > 0) {
            const updateUserResponse = await updateUser(
                { id: userId, deleted_at: null },
                userUpdates,
                requestId
            );
            
            if (updateUserResponse.error) {
                return updateUserResponse.errorData;
            }
        }
        
        // Prepare user_information table updates
        const profileUpdates = {};
        if (name !== undefined) profileUpdates.name = name;
        if (profile_title !== undefined) profileUpdates.profile_title = profile_title;
        if (country !== undefined) profileUpdates.country = country;
        if (industry !== undefined) profileUpdates.industry = industry;
        if (age !== undefined) profileUpdates.age = age;
        if (linkedin !== undefined) profileUpdates.linkedin = linkedin;
        if (github !== undefined) profileUpdates.github = github;
        if (experience !== undefined) profileUpdates.experience = experience;
        if (description !== undefined) profileUpdates.description = description;
        if (gender !== undefined) profileUpdates.gender = gender;
        
        // Update user_information table if there are changes
        if (Object.keys(profileUpdates).length > 0) {
            try {
                const userInfo = existingUser.user_information;
                
                if (userInfo) {
                    // Update existing user_information record
                    await UserInformation.update(
                        { ...profileUpdates, updated_at: new Date() },
                        { where: { user_id: userId } }
                    );
                } else {
                    // Create new user_information record
                    await UserInformation.create({
                        user_id: userId,
                        ...profileUpdates,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            } catch (profileError) {
                logger.error(FILE_NAME, 'adminEditUser', requestId, {
                    error: profileError,
                    message: 'Failed to update user profile information',
                    userId
                });
                return {
                    statusCode: 500,
                    body: {
                        message: 'User updated but profile update failed'
                    }
                };
            }
        }
        
        // Fetch updated user data to return
        const updatedUserResponse = await getUser(
            { id: userId, deleted_at: null },
            [{
                model: UserInformation,
                as: 'user_information',
                required: false
            }],
            null,
            requestId
        );
        
        const updatedUser = updatedUserResponse.data.user;
        const userInfo = updatedUser.user_information;
        
        // Format response
        const responseData = {
            id: updatedUser.id,
            email: updatedUser.email,
            persona_type: updatedUser.persona_type,
            email_verified_at: updatedUser.email_verified_at,
            verified_by_admin: !!updatedUser.email_verified_at,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at,
            
            // Profile information
            name: userInfo?.name || null,
            profile_title: userInfo?.profile_title || null,
            country: userInfo?.country || null,
            industry: userInfo?.industry || null,
            age: userInfo?.age || null,
            linkedin: userInfo?.linkedin || null,
            github: userInfo?.github || null,
            experience: userInfo?.experience || null,
            description: userInfo?.description || null,
            gender: userInfo?.gender || null
        };
        
        logger.info(FILE_NAME, 'adminEditUser', requestId, {
            message: 'Admin successfully updated user',
            userId,
            updatedFields: {
                userFields: Object.keys(userUpdates),
                profileFields: Object.keys(profileUpdates)
            }
        });
        
        return {
            statusCode: 200,
            body: {
                message: 'User updated successfully',
                user: responseData
            }
        };
        
    } catch (error) {
        logger.error(FILE_NAME, 'adminEditUser', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            userId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update user.'
            }
        };
    }
}

