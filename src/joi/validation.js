import Joi from 'joi';
import { BOOKING_STATUSES, USER_ROLES, VALID_USER_SEARCH_FILTERS, LENS_TYPES } from '../helper/constants.js';

export const common = (body, bodySchema, headers = null, headerSchema = null) => {

    let headerError = null;
    if (headerSchema) {
        const { error } = (headerSchema.validate(headers || {}, { convert: true }));
        headerError = error;
    }

    let bodyError = null;
    if (bodySchema) {
        const { error } = bodySchema.validate(body, { abortEarly: false });
        bodyError = error || null;
    }

    return {
        bodyError,
        headerError
    };
}

export const loginValidation = (body) => {
    const loginBodySchema = Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }).required(), // tlds: false, allows invalid values like foo@bar.com
        password: Joi.string().min(8).max(128).required(),
    }).unknown(false);

    return common(body, loginBodySchema);
}

export const signupValidation = (body) => {
    const signupBodySchema = Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }).required(),
        password: Joi.string().min(8).max(128).required(),
    }).unknown(false);

    return common(body, signupBodySchema);
}

export const userRoleValidation = (body) => {
    const userRoleSchema = Joi.object({
        role: Joi.string()
            .valid(...Object.values(USER_ROLES))
            .required()
            .messages({
                'any.only': `Invalid value for role`,
            }),
    }).unknown(false);

    return common(body, userRoleSchema);
};

export const updateUserInformationValidation = (body) => {
    const userRoleSchema = Joi.object({
        name: Joi.string().required('User name is required'),
    }).unknown(false);

    return common(body, userRoleSchema);
}

export const getIdeaByIDValidation = (body) => {
    const userRoleSchema = Joi.object({
        ideaId: Joi.number().required().messages({
            'any.only': 'Idea id is required',
        })
    }).unknown(true);

    return common(body, userRoleSchema);
}

export const createIdeaValidation = (body) => {
    const createIdeaSchema = Joi.object({
        name: Joi.string().required().messages({
            'any.required': 'Idea name is required'
        }),
        description: Joi.string().required().messages({
            'any.required': 'Description is required'
        }),
        targeted_audience: Joi.string().required().messages({
            'any.required': 'Targeted audience is required'
        }),
        stage: Joi.string().required().messages({
            'any.required': 'Stage is required'
        }),
        pitch_deck_file: Joi.optional(),
        voice_note_file: Joi.optional(),
        document_file: Joi.optional(),
    }).unknown(true);

    return common(body, createIdeaSchema);
}

export const storeIdeaValidation = (body) => {
    const createIdeaSchema = Joi.object({
        request_id: Joi.required().messages({
            'any.required': 'request_id is required'
        }),
    }).unknown(true);

    return common(body, createIdeaSchema);
}


export const verifyOTPValidation = (body) => {
    const verifyOtpSchema = Joi.object({
        otp: Joi.number().required(),
        email: Joi.string().email({ tlds: { allow: false } }).required(), // tlds: false, allows invalid values like foo@bar.com
    }).unknown(false);

    return common(body, verifyOtpSchema);
}

export const verifyPasswordResetOTPValidation = (body) => {
    const verifyPasswordResetOtpSchema = Joi.object({
        otp: Joi.number().required(),
        email: Joi.string().email({ tlds: { allow: false } }).required(), // tlds: false, allows invalid values like foo@bar.com
    }).unknown(false);

    return common(body, verifyPasswordResetOtpSchema);
}

export const getBookingValidation = (body) => {
    const getBookingSchema = Joi.object({
        bookingId: Joi.number().required()
    }).unknown(false);

    return common(body, getBookingSchema);
}

export const getBookingsValidation = (body) => {
    const getBookingsSchema = Joi.object({
        creatorId: Joi.number().optional(),
        bookingIds: Joi.array().optional(),
        participantId: Joi.number().optional(),
        startTime: Joi.date().optional(),
        endTime: Joi.date().optional(),
        status: Joi.string().valid(...Object.values(BOOKING_STATUSES)).messages({
            'any.only': `Invalid value for status`,
        }).optional(),
        conditions: Joi.string().valid(['and', 'or']).messages({
            'any.only': `Invalid value for condition`,
        }).optional(),
        sortBy: Joi.string().valid(['created_at', 'updated_at', 'start_time', 'end_time']).messages({
            'any.only': `Invalid value for sortBy`,
        }).optional(),
    }).unknown(false);

    return common(body, getBookingsSchema);
}

export const createBookingValidation = (body) => {
    const createBookingSchema = Joi.object({
        creatorId: Joi.number().required(),
        participantId: Joi.number().required(),
        startTime: Joi.date().required(),
        endTime: Joi.date().required()
    }).unknown(false);

    return common(body, createBookingSchema);
}

export const updateBookingValidation = (body) => {
    const updateBookingSchema = Joi.object({
        bookingId: Joi.number().required(),
        status: Joi.string().valid(...[ 
            BOOKING_STATUSES.DECLINED,
            BOOKING_STATUSES.CANCELLED,
            BOOKING_STATUSES.SCHEDULED
        ]).messages({
            'any.only': `Invalid value for status`,
        }).required()
    }).unknown(false);

    return common(body, updateBookingSchema);
}

export const forgotPasswordValidation = (body) => {
    const forgotPasswordSchema = Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }).required(), // tlds: false, allows invalid values like foo@bar.com
    }).unknown(false);

    return common(body, forgotPasswordSchema);
}

export const resetPasswordValidation = (body) => {
    const resetPasswordSchema = Joi.object({
        password: Joi.string().min(8).max(128).required(),
        resetToken: Joi.string().required(),
    }).unknown(false);

    return common(body, resetPasswordSchema);
}

export const forgotPasswordSetValidation = (body) => {
    const forgotPasswordSetSchema = Joi.object({
        password: Joi.string().min(8).max(128).required(),
        resetToken: Joi.string().required(),
    }).unknown(false);

    return common(body, forgotPasswordSetSchema);
}

export const changePasswordValidation = (body) => {
    const changePasswordSchema = Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).max(128).required(),
    }).unknown(true);

    return common(body, changePasswordSchema);
}

export const joinMeetingValidation = (body) => {
    const joinMeetingSchema = Joi.object({
        meetingId: Joi.string().required(),
    }).unknown(false);

    return common(body, joinMeetingSchema);
}

export const onBoardFounderValidation = (body) => {
    const onBoardFounderSchema = Joi.object({
       name: Joi.string().max(100).required(),
        avatar: Joi.string().optional(),
        profile_title: Joi.string().max(255).required(),
        industry: Joi.string().required(),
        linkedin: Joi.string().uri({ scheme: ['https'] }).required(),
        country: Joi.string().required(),
        // experience: Joi.string().required(),
        description: Joi.string().required(),
        // cv_url: Joi.string().uri({ scheme: ['https'] }).required(),
        // age: Joi.number().min(18).max(100).required(),
        availableSlots: Joi.array().items(
            Joi.object({
                day: Joi.number()
                .integer()
                .min(0)
                .max(6)
                .required()
                .messages({
                    'number.base': 'Day must be a number between 0 and 6',
                    'number.min': 'Day must be between 0 (Sunday) and 6 (Saturday)',
                    'number.max': 'Day must be between 0 (Sunday) and 6 (Saturday)',
                    'any.required': 'Day is required',
                }),
                times: Joi.array().items(
                    Joi.string()
                    .pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
                    .required()
                    .messages({
                        'string.pattern.base': 'Time must be in the format HH:MM-HH:MM',
                        'any.required': 'Time is required',
                    })
                )
                .optional()
            })
        )
    }).unknown(true);

    return common(body, onBoardFounderSchema);
}

export const onBoardSMEValidation = (body) => {
    const onBoardSMESchema = Joi.object({
        name: Joi.string().max(100).required(),
        avatar: Joi.optional(),
        profile_title: Joi.string().max(255).required(),
        experience: Joi.string().required(),
        description: Joi.string().required(),
        industry: Joi.string().required(),
        linkedin: Joi.string().uri({ scheme: ['https'] }).required(),
        // github: Joi.string().uri({ scheme: ['https'] }).required(),
        country: Joi.string().required(),
        age: Joi.number().min(18).max(100).required(),
        cv_url: Joi.string().uri({ scheme: ['https'] }).required(),
        availableSlots: Joi.array().items(
            Joi.object({
                day: Joi.number()
                .integer()
                .min(0)
                .max(6)
                .required()
                .messages({
                    'number.base': 'Day must be a number between 0 and 6',
                    'number.min': 'Day must be between 0 (Sunday) and 6 (Saturday)',
                    'number.max': 'Day must be between 0 (Sunday) and 6 (Saturday)',
                    'any.required': 'Day is required',
                }),
                times: Joi.array().items(
                    Joi.string()
                    .pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
                    .required()
                    .messages({
                        'string.pattern.base': 'Time must be in the format HH:MM-HH:MM',
                        'any.required': 'Time is required',
                    })
                )
                .optional()
            })
        )
    }).unknown(true);

    return common(body, onBoardSMESchema);
}

export const onBoardRespondentValidation = (body) => {
    const onBoardRespondentSchema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(18).max(100).required(),
        country: Joi.string().required(),
        gender: Joi.string().optional()
    }).unknown(true);

    return common(body, onBoardRespondentSchema);
}

export const getFormValidation = (body) => {
    const getFormSchema = Joi.object({
        ideaId: Joi.number().required()
    }).unknown(false);

    return common(body, getFormSchema);
}

export const createFormValidation = (body) => {
    const createFormSchema = Joi.object({
        startTime: Joi.string().required(),
        endTime: Joi.string().required(),
        ideaId: Joi.number().required(),
        demographic: Joi.required(),
        questions: Joi.array().items(
            Joi.object({
                text: Joi.string().required(),
                type: Joi.string().valid('scale', 'mcq', 'text', 'yes_no').required(),
                options: Joi.alternatives().conditional('type', {
                    switch: [
                        {
                            is: Joi.valid('mcq'),
                            then: Joi.array().min(2).items(Joi.string()).required(),
                        },
                        // {
                        //     is: Joi.valid('scale'),
                        //     then: Joi.array().min(2).items(Joi.number()).required()
                        // },
                    ],
                    otherwise: Joi.forbidden(),
                })
            }).required()
        ).min(1).max(20).required(),
    }).unknown(true);

    return common(body, createFormSchema);
}

export const retryFormUploadValidation = (body) => {
    const createFormSchema = Joi.object({
        ideaId: Joi.number().required(),
        formId: Joi.number().required(),
        questions: Joi.array().items(
            Joi.object({
                text: Joi.string().required(),
                type: Joi.string().valid('scale', 'mcq', 'text', 'yes_no').required(),
                options: Joi.alternatives().conditional('type', {
                    switch: [
                        {
                            is: Joi.valid('mcq'),
                            then: Joi.array().min(2).items(Joi.string()).required(),
                        },
                        {
                            is: Joi.valid('scale'),
                            then: Joi.array().min(2).items(Joi.number()).required()
                        },
                    ],
                    otherwise: Joi.forbidden(),
                })
            }).required()
        ).min(5).max(20).required(),
    }).unknown(false);

    return common(body, createFormSchema);
}

export const getFormResponsesValidation = (body) => {
    const updateFormResponseSchema = Joi.object({
        formId: Joi.number().required(),
        formResponseId: Joi.number().required()
    }).unknown(false);

    return common(body, updateFormResponseSchema);
}

export const createFormResponsesValidation = (body) => {
    const createFormResponseSchema = Joi.object({
        ideaId: Joi.number().required(),
        formId: Joi.number().required(),
        questions: Joi.array().items(
            Joi.object({
                text: Joi.string().required(),
                type: Joi.string().valid('scale', 'mcq', 'text', 'yes_no').required(),
                options: Joi.alternatives().conditional('type', {
                    switch: [
                        {
                            is: Joi.valid('mcq'),
                            then: Joi.array().min(2).items(Joi.string()).required(),
                        },
                        {
                            is: Joi.valid('scale'),
                            then: Joi.array().min(2).items(Joi.number()).required()
                        },
                    ],
                    otherwise: Joi.forbidden(),
                }),
                answer: Joi.alternatives().conditional('type', {
                    switch: [
                        {
                            is: Joi.valid('mcq'),
                            then: Joi.array().min(1).items(Joi.string()).required(),
                        },
                        {
                            is: Joi.valid('scale'),
                            then: Joi.array().min(1).items(Joi.number()).required()
                        },
                    ],
                    otherwise: Joi.string(),
                }),
            }).required()
        ).min(5).max(20).required(),
    }).unknown(false);

    return common(body, createFormResponseSchema);
}

export const retryFormResponsesUploadValidation = (body) => {
    const createFormResponseSchema = Joi.object({
        ideaId: Joi.number().required(),
        formId: Joi.number().required(),
        formResponseId: Joi.number().required(),
        questions: Joi.array().items(
            Joi.object({
                text: Joi.string().required(),
                type: Joi.string().valid('scale', 'mcq', 'text', 'yes_no').required(),
                options: Joi.alternatives().conditional('type', {
                    switch: [
                        {
                            is: Joi.valid('mcq'),
                            then: Joi.array().min(2).items(Joi.string()).required(),
                        },
                        {
                            is: Joi.valid('scale'),
                            then: Joi.array().min(2).items(Joi.number()).required()
                        },
                    ],
                    otherwise: Joi.forbidden(),
                }),
                answer: Joi.alternatives().conditional('type', {
                    switch: [
                        {
                            is: Joi.valid('mcq'),
                            then: Joi.array().min(1).items(Joi.string()).required(),
                        },
                        {
                            is: Joi.valid('scale'),
                            then: Joi.array().min(1).items(Joi.number()).required()
                        },
                    ],
                    otherwise: Joi.string(),
                }),
            }).required()
        ).min(5).max(20).required(),
    }).unknown(false);

    return common(body, createFormResponseSchema);
}

export const searchUsersValidation = (body) => {
    const searchUserSchema = Joi.object({
        persona_type: Joi.string().valid(USER_ROLES.FOUNDER, USER_ROLES.SME).messages({ 'any.only': `Invalid value for persona_type` }).required(),
        name: Joi.string().optional()
    }).unknown(false);

    return common(body, searchUserSchema);
}

export const smeMatchmakingValidation = (body) => {
    const smeMatchmakingSchema = Joi.object({
        ideaId: Joi.number().required().messages({
            'any.required': 'Idea ID is required',
            'number.base': 'Idea ID must be a number'
        }),
        role_type: Joi.string().valid(...Object.values(USER_ROLES)).required().messages({
            'any.required': 'Role type is required',
            'any.only': 'Invalid value for role_type'
        })
    }).unknown(false);

    return common(body, smeMatchmakingSchema);
}

export const selectLensValidation = (body) => {
    const selectLensSchema = Joi.object({
        ideaId: Joi.number().required().messages({
            'any.required': 'Idea ID is required',
            'number.base': 'Idea ID must be a number'
        }),
        selectedLens: Joi.array().items(
            Joi.string().valid(...Object.values(LENS_TYPES)).required()
        ).min(1).required().messages({
            'any.required': 'Selected lens array is required',
            'array.min': 'At least one lens must be selected',
            'array.base': 'Selected lens must be an array'
        })
    }).unknown(false);

    return common(body, selectLensSchema);
}

export const selectUsersValidation = (body) => {
    const selectUsersSchema = Joi.object({
        ideaId: Joi.number().required().messages({
            'any.required': 'Idea ID is required',
            'number.base': 'Idea ID must be a number'
        }),
        userIds: Joi.array().items(
            Joi.number().required()
        ).min(1).required().messages({
            'any.required': 'User IDs array is required',
            'array.min': 'At least one user must be selected',
            'array.base': 'User IDs must be an array'
        }),
        role_type: Joi.string().valid(...Object.values(USER_ROLES)).required().messages({
            'any.required': 'Role type is required',
            'any.only': 'Invalid value for role_type'
        })
    }).unknown(false);

    return common(body, selectUsersSchema);
}
