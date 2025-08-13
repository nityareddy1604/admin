import { config } from 'dotenv';
import { getForm } from './crud.js';
import { Form, FormResponses } from '../db/pool.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/forms/deleteForm.js';

export async function adminDeleteForm(body) {
    const { formId, requestId } = body;
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

        // Start transaction for safe deletion
        const transaction = await Form.sequelize.transaction();

        try {
            // Delete form responses first (child records)
            const deletedResponsesCount = await FormResponses.destroy({
                where: { form_id: formId },
                transaction
            });

            // Delete the form
            await Form.destroy({
                where: { id: formId },
                transaction
            });

            // Commit transaction
            await transaction.commit();

            logger.info(FILE_NAME, 'adminDeleteForm', requestId, {
                formId,
                deletedResponsesCount,
                message: 'Form and all responses deleted successfully'
            });

            return {
                statusCode: 200,
                body: {
                    message: 'Form deleted successfully',
                    deletedFormId: formId,
                    deletedResponsesCount
                }
            };

        } catch (transactionError) {
            // Rollback transaction on error
            await transaction.rollback();
            throw transactionError;
        }

    } catch (error) {
        logger.error(FILE_NAME, 'adminDeleteForm', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            formId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to delete form'
            }
        };
    }
}
