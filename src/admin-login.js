import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { logger } from './logger/logger.js';
import { loginValidation } from './joi/validation.js';

config();

const FILE_NAME = 'admin-login.js';

// Admin credentials - in production, store in database
const ADMIN_CREDENTIALS = {
    email: process.env.ADMIN_EMAIL || 'admin@outlaw.com',
    password: process.env.ADMIN_PASSWORD_HASH // Pre-hashed password
};

export async function adminLogin(body) {
    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = loginValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const { email, password } = body;

        // Check if email matches admin email
        if (email !== ADMIN_CREDENTIALS.email) {
            return {
                statusCode: 401,
                body: { 
                    message: 'Invalid admin credentials!' 
                }
            }
        }

        // Verify password
        const isValidPassword = bcrypt.compareSync(password, ADMIN_CREDENTIALS.password);
        
        if (!isValidPassword) {
            return {
                statusCode: 401,
                body: { 
                    message: 'Invalid admin credentials!' 
                }
            }
        }

        // Generate JWT token with admin role
        const token = jwt.sign(
            {
                userId: 'admin',
                email: email,
                role: 'admin',
                isAdmin: true,
                persona_type: 'admin'  // Add this line
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: process.env.JWT_EXPIRY || '24h'
            }
        );

        return {
            statusCode: 200,
            body: {
                token,
                user: {
                    email: email,
                    role: 'admin',
                    isAdmin: true
                },
                message: 'Admin login successful'
            }
        }

    } catch (error) {
        logger.error(FILE_NAME, 'adminLogin', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Cannot login.'
            }
        }
    }
}

