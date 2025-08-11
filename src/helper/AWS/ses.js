import { config } from 'dotenv';
import { mailClient } from './aws-sdk.js';
import { logger } from '../../logger/logger.js';
import { EMAIL_USE_CASES } from '../constants.js';
import { SendEmailCommand } from '@aws-sdk/client-sesv2';
import axios from "axios";

config();

const FILE_NAME = 'ses.js';

function createSendMailCommandPayload(toAddresses) {
    return {
        Destination: {
            ToAddresses: toAddresses,
        },
        Content: {
            Simple: {
                Body: {
                    Text: {
                        Charset: 'UTF-8',
                        Data: '',
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: '',
                }
            }
        },
        FromEmailAddress: process.env.OTP_VERIFICATION_FROM_EMAIL || "avichal@pragami.com"
    };
}

export async function sendEmail(toAddresses, useCase, data, requestId) {
    let sendEmailCommand = createSendMailCommandPayload(toAddresses);
    try {
        switch (useCase) {
            case EMAIL_USE_CASES.OTP_VERIFICATION: {
                sendEmailCommand.Content.Simple.Subject.Data = 'Outlaw Email Verification'
                sendEmailCommand.Content.Simple.Body.Text.Data = `Your OTP is ${data.otp}. It is valid for the next 15 minutes.`
                break;
            }
            case EMAIL_USE_CASES.FORGOT_PASSWORD: {
                sendEmailCommand.Content.Simple.Subject.Data = 'Forgot Password Link'
                sendEmailCommand.Content.Simple.Body.Text.Data = `Forgot Password Link ${data.link}. It is valid for the next 1 hour.`
                break;
            }
            default: {
                return;
            }
        }
        
        sendEmailCommand = new SendEmailCommand(sendEmailCommand);
        const sendMailRes = await mailClient.send(sendEmailCommand);
        console.log('sendMailRes: ', sendMailRes);

        return {
            error: false,
            data: sendMailRes
        }
    } catch (error) {
        logger.error(FILE_NAME, 'sendEmail', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            error: true,
            errorData: {
                statusCode: 400,
                body: {
                    message: 'Internal Server Error! Email flows impacted.'
                }
            }
        }
    }
}
export async function sendMailWithAPI(emailData) {
    const apiEndpoint = process.env.SEND_EMAIL_API_ENDPOINT;
    const { 
        to, 
        from = process.env.OTP_VERIFICATION_FROM_EMAIL || "",
        cc,
        bcc,
        subject,
        html,
        text,
        templateData
    } = emailData;

    const payload = {
        from,
        to: Array.isArray(to) ? to : [to],
        subject
    };

    // Add optional parameters only if they exist
    if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];
    if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc];
    if (html) payload.html = html;
    if (text) payload.text = text;
    if (templateData) payload.templateData = templateData;

    try {
        const response = await axios.post(apiEndpoint, payload);
        return { error: false, data: response.data };
    } catch (error) {
        logger.error(FILE_NAME, 'sendMailWithAPI', emailData.requestId, {
            error,
            errorMessage: error.message
        });
        return { 
            error: true, 
            errorData: {
                statusCode: error.response?.status || 500,
                body: {
                    message: 'Failed to send email',
                    error: error.message
                }
            }
        };
    }
}
