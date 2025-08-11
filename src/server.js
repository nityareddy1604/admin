/*import { config } from 'dotenv';
import { me } from './user/me.js';

import { hello } from './auth/hello.js';
import { login } from './auth/login.js';
import { signup } from './auth/signup.js';
import { getFormAPI } from './forms/read.js';
import { storeIdea } from './idea/storeIdea.js';
import { getIdeasAPI } from './idea/getIdeas.js';
import { resendOTP } from './auth/resendOTP.js';
import { verifyOtp } from './auth/verifyOtp.js';
import { createIdeaAPI } from './idea/createIdea.js';
import {ADMIN_API_PATHS, API_PATHS} from './helper/constants.js';
import { createFormAPI } from './forms/create.js';
import { onBoardUser } from './onboarding/index.js';
import { googleLogin } from './auth/google/login.js';
import { getIdeaById } from './idea/getIdeaById.js';
import { getStoreIdea } from './idea/getStoreIdea.js';
import { googleSignup } from './auth/google/signup.js';
import { createFormS3LinkAPI } from './forms/retry.js';
import { createBookingAPI } from './bookings/create.js';
import { getLatestIdea } from './idea/getLatestIdea.js';
import { updateBookingAPI } from './bookings/update.js';
import { resetPassword } from './auth/resetPassword.js';
import { regenerateIdea } from './idea/regenerateIdea.js';
import { searchUsersAPI } from './marketplace/search.js';
import { createUserRole } from './auth/createUserRole.js';
import { forgotPassword } from './auth/forgotPassword.js';
import { userInformation } from './user/userInformation.js';
import { ideaLensSelector } from './idea/ideaLensSelector.js';
import { createFormResponseAPI } from './form_responses/create.js';
import { getBookingAPI, getBookingsAPI } from './bookings/read.js';
import { getAvailableSlots } from './bookings/getAvailableSlots.js';
import { storeBurningProblem } from './idea/storeBurningProblem.js';
import { createFormResponseS3LinkAPI } from './form_responses/retry.js';
import { getFormResponseAPI, getFormResponsesAPI } from './form_responses/read.js';
import { parseStringifiedBody, extractTokenFromHeaders, verifyAuthToken } from './helper/helper.js';
import {ideaSurveyGenerator} from "./idea/ideaSurveyGenerator.js";
import {getPublicForm} from "./forms/getPublicForm.js";
import {getForms} from "./forms/getForms.js";
import {getForm} from "./forms/getForm.js";
import {createResponse} from "./form_responses/createResponse.js";
import { getUserDetails } from './auth/getUser.js';
import { smeMatchmakingAPI } from './matchmaking/sme.js';
import { logger } from './logger/logger.js';
import { getUserConsent } from './auth/getUserConsent.js';
import { updateUserConsent } from './auth/updateUserConsent.js';
import {createMeeting as createMeetingAdmin} from "./bookings/create-meeting.js";
import {createBookingAdmin } from "./bookings/create.js";
import {createMeeting } from "./bookings/create-meeting.js";
import {googleLoginOrSignup} from "./auth/google/googleLoginOrSignup.js";*/

import { config } from 'dotenv';
import { logger } from './logger/logger.js';
import { init } from './db/pool.js';
import {adminLogin} from './admin-login.js';
import { parseStringifiedBody, extractTokenFromHeaders, verifyAuthToken } from './helper/helper.js';
import {ADMIN_API_PATHS, API_PATHS} from './helper/constants.js';

import { getAllUsers } from './user/getAllUsers.js';
import {adminCreateUser } from './user/createUser.js';
import {adminDeleteUser } from './user/deleteUser.js';
import {adminApproveUser } from './user/approveUser.js';
import {adminGetUserDetails } from './user/getUserDetails.js';
import {adminEditUser } from './user/editUser.js';

import { adminGetAllBookings } from './booking/getAllBookings.js';
import { createBookingAdmin } from './booking/create-booking.js';
import {getAvailableSlots} from './booking/getAvailableSlots.js';
import { updateBookingAPI } from './booking/update.js';
import {createMeeting} from './booking/create-meeting.js';
import { myIdea } from './booking/myIdea.js';   

// Analytics imports
import { healthCheck } from './analytics/healthCheck.js';
import { userOverview } from './analytics/userOverview.js';
import { userGrowth } from './analytics/userGrowth.js';
import { userDemographics } from './analytics/userDemographics.js';
import { ideasOverview } from './analytics/ideasOverview.js';
import { formsOverview } from './analytics/formsOverview.js';
import { smeOverview } from './analytics/smeOverview.js';
import { bookingsOverview } from './analytics/bookingsOverview.js';
import { chimeOverview } from './analytics/chimeOverview.js';
import { chimeTranscripts } from './analytics/chimeTranscripts.js';
import { engagementFunnel } from './analytics/engagementFunnel.js';
import { realtimeDashboard } from './analytics/realtimeDashboard.js';
import { adminGetAllIdeas } from './idea/getAllIdeas.js';


config();

const FILE_NAME = 'root/server.js';

export const app = async (event, context, requestId) => {
    console.log({
        event, context, requestId
    })

    await init(requestId);
    let body = parseStringifiedBody(event.body);
    body.requestId = requestId;

    const skipMiddleWareForRoutes = [
        API_PATHS.LOGIN,
        API_PATHS.SIGNUP,
        API_PATHS.RESET_PASSWORD,
        API_PATHS.FORGOT_PASSWORD,
        API_PATHS.HELLO,
        API_PATHS.GOOGLE_OAUTH,
        API_PATHS.GOOGLE_SIGNUP,
        API_PATHS.GOOGLE_LOGIN,
        API_PATHS.RESEND_OTP,
        API_PATHS.VERIFY_OTP,
        API_PATHS.GET_PUBLIC_FORM,
        API_PATHS.GOOGLE_AUTH,
        ADMIN_API_PATHS.ADMIN_LOGIN
    ];

   /* if (event.rawPath.includes('default')) {
        event.rawPath = event.rawPath.slice('/default'.length);
    }*/
    const actualEvent = event?.event || event;
    const rawPath = actualEvent.rawPath || actualEvent.path || '';
    
    // BUG 1: Use rawPath instead of event.rawPath
    if (!skipMiddleWareForRoutes.includes(rawPath)) {
        // BUG 2: Use rawPath instead of event.rawPath
        console.log('🔍 Checking auth for path:', rawPath);
        // BUG 3: Use actualEvent.headers instead of event.headers
        const tokenFromHeaders = extractTokenFromHeaders(actualEvent.headers);
        console.log('🔍 Token extracted:', !!tokenFromHeaders);
        if (!tokenFromHeaders) {
            console.log('❌ No token found');
            return { statusCode: 401, body: { error: 'Unauthorized Request! Auth Token missing' }};
        }
        const tokenData = verifyAuthToken(tokenFromHeaders);
        console.log('🔍 Token verification result:', tokenData);
        if (!tokenData.userId) {
            console.log('❌ Token verification failed');
            return {
                statusCode: 401,
                body: {
                    error: 'Unauthorized Request! Auth Token expired'
                }
            };
        }
        // Check for admin routes
        // BUG 4: Use rawPath instead of event.rawPath
        const isAdminRoute = Object.values(ADMIN_API_PATHS).some(path => rawPath === path);
        console.log('🔍 Is admin route:', isAdminRoute);
        if (isAdminRoute) {
            const isUserAdmin = tokenData.persona_type === 'admin' ||
                tokenData.role === 'admin' ||
                tokenData.isAdmin === true;
            console.log('🔍 Is user admin:', isUserAdmin, 'tokenData:', tokenData);
            if (!isUserAdmin) {
                return {
                    statusCode: 401,
                    body: {
                        error: 'Unauthorized! Admin access required'
                    }
                };
            }
        }
        // For admin routes, preserve the original userId from request, store admin ID separately
        if (isAdminRoute) {
            body.adminUserId = tokenData.userId; // Store admin ID separately
            // Don't overwrite body.userId - keep the target user ID
        } else {
            body.userId = tokenData.userId; // For regular routes, set user ID normally
        }
    }
    
    if (body.userId && body.userId !== 'admin' && isNaN(Number(body.userId))) {
        logger.warn(FILE_NAME, 'app', requestId, {
            message: 'Possible SQL Injection attempt on users table!',
            data: {
                userId: body.userId,
                type: typeof body.userId
            }
        });
        return {
            statusCode: 400,
            body: {
                message: 'Invalid userId format'
            }
        };
    }
    switch (event.rawPath) {
        case API_PATHS.LOGIN: {
            return await login(body);
        }
        case API_PATHS.GOOGLE_SIGNUP: {
            return await googleSignup(body);
        }
        case API_PATHS.GOOGLE_LOGIN: {
            return await googleLogin(body);
        }
        case API_PATHS.SIGNUP: {
            return await signup(body);
        }
        case API_PATHS.VERIFY_OTP: {
            return await verifyOtp(body);
        }
        case API_PATHS.HELLO: {
            // Test route, to be removed later
            return await hello();
        }
        case API_PATHS.CREATE_ROLE: {
            return await createUserRole(body);
        }
        case API_PATHS.USER_INFORMATION: {
            return await userInformation(body); // update profile
        }
        case API_PATHS.ME: {
            return await me(body); // fetch profile
        }
        case API_PATHS.CREATE_IDEA: {
            // Idea Capture, when user enters details and pitch deck files
            return await createIdeaAPI(body);
        }
        case API_PATHS.GET_LATEST_IDEA: {
            // TODO: check usage
            return await getLatestIdea(body);
        }
        case API_PATHS.STORE_IDEA: {
            // When user accepts AI generated idea response
            return await storeIdea(body);
        }
        case API_PATHS.REGENERATE_IDEA: {
            // When user asks to regenerate AI response
            return await regenerateIdea(body);
        }
        case API_PATHS.GET_STORE_IDEA: {
            // In case user goes back to idea capture phase
            return await getStoreIdea(body);
        }
        case API_PATHS.STORE_BURNING_PROBLEM: {
            // Stores users entered burning problems
            return await storeBurningProblem(body);
        }
        case API_PATHS.IDEA_LENS_SELECTOR: {
            // Last step of idea capture phase, calls Lens Selector AI
            return await ideaLensSelector(body);
        }
        case API_PATHS.GET_IDEAS: {
            return await getIdeasAPI(body);
        }
        case API_PATHS.GET_IDEA_BY_ID: {
            return await getIdeaById(body);
        }
        case API_PATHS.IDEA_SURVEY_GENERATOR: {
            return await ideaSurveyGenerator(body);
        }
        case API_PATHS.CREATE_BOOKING: {
            return await createBookingAPI(body);
        }
        case API_PATHS.UPDATE_BOOKING: {
            return await updateBookingAPI(body);
        }
        // for GET request with path params, best practice is to use routeKey instead of rawPath, so converting GET routes to POST.
        case API_PATHS.GET_BOOKING: {
            return await getBookingAPI(body);
        }
        case API_PATHS.GET_BOOKINGS: {
            return await getBookingsAPI(body);
        }
        case API_PATHS.CREATE_MEETING: {
            return await createMeeting(body);
        }
        case API_PATHS.GET_AVAILABLE_SLOTS: {
            return await getAvailableSlots(body);
        }
        case API_PATHS.FORGOT_PASSWORD: {
            return await forgotPassword(body);
        }
        case API_PATHS.RESEND_OTP: {
            return await resendOTP(body);
        }
        case API_PATHS.RESET_PASSWORD: {
            body.token = extractTokenFromHeaders(event.headers);
            return await resetPassword(body);
        }
        case API_PATHS.ONBOARD_USER: {
            return await onBoardUser(body);
        }
        case API_PATHS.GET_FORM: {
            return await getForm(body);
        }
        case API_PATHS.RETRY_FORM: {
            return await createFormS3LinkAPI(body);
        }
        case API_PATHS.CREATE_FORM: {
            return await createFormAPI(body);
        }
        case API_PATHS.GET_FORM_RESPONSE: {
            return await getFormResponseAPI(body);
        }
        case API_PATHS.GET_ALL_FORM_RESPONSE: {
            return await getFormResponsesAPI(body);
        }
        case API_PATHS.RETRY_FORM_RESPONSE: {
            return await createFormResponseS3LinkAPI(body);
        }
        case API_PATHS.CREATE_FORM_RESPONSE: {
            return await createResponse(body);
        }
        case API_PATHS.SEARCH_USERS: {
            return await searchUsersAPI(body);
        }
        case API_PATHS.GET_PUBLIC_FORM: {
            return await getPublicForm(body);
        }
        case API_PATHS.GET_FORMS: {
            return await getForms(body);
        }
        case API_PATHS.GET_USER_DETAILS: {
            return await getUserDetails(body);
        }
        case API_PATHS.SME_MATCHMAKING: {
            return await smeMatchmakingAPI(body);
        }
        case API_PATHS.GET_USER_CONSENT: {
            return await getUserConsent(body);
        }
        case API_PATHS.UPDATE_USER_CONSENT: {
            return await updateUserConsent(body);
        }

        case API_PATHS.GOOGLE_AUTH: {
            return await googleLoginOrSignup(body);
        }
        /**
         * ADMIN ROUTES
         */
        case ADMIN_API_PATHS.CREATE_MEETING: {
            // expects only bookingId in body
            return await createMeeting(body);
        }
        case ADMIN_API_PATHS.CREATE_BOOKING: {
            // expects only bookingId in body
            return await createBookingAdmin(body);
        }
        case ADMIN_API_PATHS.GET_ALL_BOOKINGS: {
            return await adminGetAllBookings(body);
        }
        case ADMIN_API_PATHS.UPDATE_BOOKING: {
            return await updateBookingAPI(body);
        }
        case ADMIN_API_PATHS.MY_IDEA: {
            return await myIdea(body);
        }
        case ADMIN_API_PATHS.AVAILABLE_SLOTS: {
            return await getAvailableSlots(body);
        }

        

                // ===== ANALYTICS LAMBDA FUNCTIONS =====
        case ADMIN_API_PATHS.HEALTH: {
            return await healthCheck(body);
        }
        case ADMIN_API_PATHS.USERS_OVERVIEW: {
            const period = event.queryStringParameters?.period || 'all';
            return await userOverview({ ...body, period });
        }
        case ADMIN_API_PATHS.USERS_GROWTH: {
            const period = event.queryStringParameters?.period || '30';
            return await userGrowth({ ...body, period });
        }
        case ADMIN_API_PATHS.USERS_DEMOGRAPHICS: {
            return await userDemographics(body);
        }
        case ADMIN_API_PATHS.IDEAS_OVERVIEW: {
            const period = event.queryStringParameters?.period || 'all';
            return await ideasOverview({ ...body, period });
        }
        case ADMIN_API_PATHS.FORMS_OVERVIEW: {
            const period = event.queryStringParameters?.period || 'all';
            return await formsOverview({ ...body, period });
        }
        case ADMIN_API_PATHS.SME_OVERVIEW: {
            const period = event.queryStringParameters?.period || 'all';
            return await smeOverview({ ...body, period });
        }
        case ADMIN_API_PATHS.BOOKINGS_OVERVIEW: {
            const period = event.queryStringParameters?.period || 'all';
            return await bookingsOverview({ ...body, period });
        }
        case ADMIN_API_PATHS.CHIME_OVERVIEW: {
            const period = event.queryStringParameters?.period || 'all';
            return await chimeOverview({ ...body, period });
        }
        case ADMIN_API_PATHS.CHIME_TRANSCRIPTS: {
            const period = event.queryStringParameters?.period || '30';
            return await chimeTranscripts({ ...body, period });
        }
        case ADMIN_API_PATHS.ENGAGEMENT_FUNNEL: {
            return await engagementFunnel(body);
        }
        case ADMIN_API_PATHS.REALTIME_DASHBOARD: {
            return await realtimeDashboard(body);
        }
                /**
         * ADMIN USER MANAGEMENT ROUTES
         */
        case ADMIN_API_PATHS.APPROVE_USER: {
            return await adminApproveUser(body); 
        }
        case ADMIN_API_PATHS.CREATE_USER: {
            return await adminCreateUser(body);
        }
        case ADMIN_API_PATHS.DELETE_USER: {
            return await adminDeleteUser(body);
        }
        case ADMIN_API_PATHS.GET_ALL_USERS: {
            return await getAllUsers(body);
        }
        case ADMIN_API_PATHS.EDIT_USER: {
            const userId = event.pathParameters?.userId || body.userId;
            return await adminEditUser({ ...body, userId });
        } 
        case ADMIN_API_PATHS.GET_USER_DETAILS: {
            const userId = event.pathParameters?.userId || body.userId;
            return await adminGetUserDetails({ ...body, userId, requestId: body.requestId });
        }     
        case ADMIN_API_PATHS.ADMIN_LOGIN: {
            return await adminLogin(body);
        } 
        case ADMIN_API_PATHS.GET_ALL_IDEAS_SIMPLE: {
            return await adminGetAllIdeas(body);
        }
        
        


        default: {
            return {
                statusCode: 404,
                body: {
                    message: 'Route ' + event.rawPath + 'not found'
                }
            }
        }
    }
}
