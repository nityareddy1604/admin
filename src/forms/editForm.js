import { config } from 'dotenv';
import { getForm, updateForm } from './crud.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/forms/editForm.js';

export async function adminEditForm(body) {
    const { formId, start_time, end_time, requestId } = body;
    delete body.requestId;
    
    try {
        // Validate required fields
        if (!formId) {
            return {
                statusCode: 400,
                body: {
                    message: 'formId is required'
                }
            };
        }

        // Check if form exists using crud function
        const existingFormResponse = await getForm(
            { id: formId },
            null,
            null,
            requestId
        );

        if (existingFormResponse.error) {
            return existingFormResponse.errorData;
        }

        const existingForm = existingFormResponse.data.form;

        // Prepare update data
        const updateData = {};

        // Add optional time fields if provided
        if (start_time !== undefined) {
            updateData.start_time = start_time ? new Date(start_time) : null;
        }
        if (end_time !== undefined) {
            updateData.end_time = end_time ? new Date(end_time) : null;
        }

        // Get current values for validation if not provided in request
        const currentStartTime = updateData.start_time !== undefined ? updateData.start_time : existingForm.start_time;
        const currentEndTime = updateData.end_time !== undefined ? updateData.end_time : existingForm.end_time;

        // Validate date logic
        if (currentStartTime && currentEndTime && currentStartTime >= currentEndTime) {
            return {
                statusCode: 400,
                body: {
                    message: 'End time must be after start time'
                }
            };
        }

        // Update the form using crud function
        const updateResponse = await updateForm(
            { id: formId },
            updateData,
            requestId
        );

        if (updateResponse.error) {
            return updateResponse.errorData;
        }

        logger.info(FILE_NAME, 'adminEditForm', requestId, {
            formId,
            updatedFields: Object.keys(updateData),
            message: 'Form schedule updated successfully'
        });

        return {
            statusCode: 200,
            body: {
                message: 'Form schedule updated successfully',
                form: updateResponse.data.form
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'adminEditForm', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            formId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update form'
            }
        };
    }
}