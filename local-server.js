import express from 'express';
import { config } from 'dotenv';
import { app as lambdaHandler } from './src/server.js';
import { ADMIN_API_PATHS, API_PATHS } from "./src/helper/constants.js";
import cors from 'cors';

config();
const expressApp = express();
expressApp.use(express.json());
expressApp.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Admin Login
expressApp.post(ADMIN_API_PATHS.ADMIN_LOGIN, async (req, res) => {
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.ADMIN_LOGIN,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Admin get all users
expressApp.post(ADMIN_API_PATHS.GET_ALL_USERS, async (req, res) => {
    const result = await lambdaHandler({
        body: JSON.stringify(req.body || {}),
        rawPath: ADMIN_API_PATHS.GET_ALL_USERS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Admin create user
expressApp.post(ADMIN_API_PATHS.CREATE_USER, async (req, res) => {
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.CREATE_USER,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Approve User - PUT /admin/user/:userId/approve
expressApp.put('/admin/user/:userId/approve', async (req, res) => {
    console.log('🔍 Approve route hit - userId from URL:', req.params.userId);
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request params:', req.params);
    
    const bodyWithUserId = {
        ...req.body,
        userId: req.params.userId
    };
    
    const result = await lambdaHandler({
        body: JSON.stringify(bodyWithUserId),
        rawPath: ADMIN_API_PATHS.APPROVE_USER,  // 🔥 FIX: Use constant
        headers: req.headers,
        httpMethod: 'PUT',
        pathParameters: { userId: req.params.userId }
    });
    res.status(result.statusCode || 200).json(result);
});

// Delete User - DELETE /admin/user/:userId
expressApp.delete('/admin/user/:userId', async (req, res) => {
    console.log('🔍 Delete route hit - userId from URL:', req.params.userId);
    
    const bodyWithUserId = {
        ...req.body,
        userId: req.params.userId
    };
    
    const result = await lambdaHandler({
        body: JSON.stringify(bodyWithUserId),
        rawPath: ADMIN_API_PATHS.DELETE_USER,  // 🔥 FIX: Use constant
        headers: req.headers,
        httpMethod: 'DELETE',
        pathParameters: { userId: req.params.userId }
    });
    res.status(result.statusCode || 200).json(result);
});

// Get User Details - GET /admin/user/:userId/details
expressApp.get('/admin/user/:userId/details', async (req, res) => {
    console.log('🔍 Get User Details route hit - userId from URL:', req.params.userId);
    
    const bodyWithUserId = {
        userId: req.params.userId,
        requestId: Date.now()
    };
    
    const result = await lambdaHandler({
        body: JSON.stringify(bodyWithUserId),
        rawPath: ADMIN_API_PATHS.GET_USER_DETAILS,  // Uses constant
        headers: req.headers,
        httpMethod: 'GET',
        pathParameters: { userId: req.params.userId }
    });
    res.status(result.statusCode || 200).json(result);
});

// Edit User - PUT /admin/user/:userId/edit  
expressApp.put('/admin/user/:userId/edit', async (req, res) => {
    console.log('🔍 Edit User route hit - userId from URL:', req.params.userId);
    
    const bodyWithUserId = {
        ...req.body,
        userId: req.params.userId
    };
    
    const result = await lambdaHandler({
        body: JSON.stringify(bodyWithUserId),
        rawPath: ADMIN_API_PATHS.EDIT_USER,  // Uses constant
        headers: req.headers,
        httpMethod: 'PUT', 
        pathParameters: { userId: req.params.userId }
    });
    res.status(result.statusCode || 200).json(result);
});

expressApp.post(ADMIN_API_PATHS.GET_ALL_BOOKINGS, async (req, res) => {
    console.log('🔍 Admin Get All Bookings route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body || {}),
        rawPath: ADMIN_API_PATHS.GET_ALL_BOOKINGS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

expressApp.post(ADMIN_API_PATHS.CREATE_BOOKING, async (req, res) => {
    console.log('🔍 Admin Create Booking route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.CREATE_BOOKING,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Admin Create Meeting - POST /admin/create-meeting  
expressApp.post(ADMIN_API_PATHS.CREATE_MEETING, async (req, res) => {
    console.log('🔍 Admin Create Meeting route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.CREATE_MEETING,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});



// Admin Update Booking - PUT /admin/update-booking/:id
expressApp.put('/admin/update-booking/:id', async (req, res) => {
    console.log('🔍 Admin Update Booking route hit - bookingId:', req.params.id);
    
    const bodyWithBookingId = {
        ...req.body,
        bookingId: req.params.id,
        adminOverride: true
    };
    
    const result = await lambdaHandler({
        body: JSON.stringify(bodyWithBookingId),
        rawPath: ADMIN_API_PATHS.UPDATE_BOOKING,
        headers: req.headers,
        httpMethod: 'PUT',
        pathParameters: { id: req.params.id }
    });
    res.status(result.statusCode || 200).json(result);
});

// Get Available Slots - POST /get-available-slots
expressApp.post(ADMIN_API_PATHS.AVAILABLE_SLOTS, async (req, res) => {
    console.log('🔍 Get Available Slots route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.AVAILABLE_SLOTS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// My Idea - POST /my-idea
expressApp.post(ADMIN_API_PATHS.MY_IDEA, async (req, res) => {
    console.log('🔍 My Idea route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.MY_IDEA,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});



const PORT = process.env.PORT || 3001;
expressApp.listen(PORT, () => {
    console.log(`🚀 Local API server running on http://localhost:${PORT}`);
});

