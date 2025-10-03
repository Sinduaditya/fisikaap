<?php
// filepath: routes/api.php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\SimulationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check endpoint
Route::get('health', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Belajar Fisika API is running',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
});

// Public routes (tidak perlu authentication)
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

// Protected routes (perlu authentication)
Route::middleware('auth:sanctum')->group(function () {

    // Auth routes - sesuai AuthController
    Route::prefix('auth')->group(function () {
        Route::get('profile', [AuthController::class, 'profile']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    // Simulation routes - sesuai SimulationController
    Route::prefix('simulation')->group(function () {
        Route::get('topics', [SimulationController::class, 'getTopics']);
        Route::get('topics/{topicSlug}/question', [SimulationController::class, 'getQuestion']);
        Route::post('questions/{questionId}/submit', [SimulationController::class, 'submitAnswer']);
    });

    // User data routes - berdasarkan User model relationships
    Route::prefix('user')->group(function () {
        Route::get('/', function (Request $request) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'user' => $request->user()
                ]
            ]);
        });

        Route::get('achievements', function (Request $request) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'achievements' => $request->user()->achievements()
                        ->with('achievement')
                        ->get()
                ]
            ]);
        });

        Route::get('progress', function (Request $request) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'progress' => $request->user()->progress()
                        ->with('topic')
                        ->get()
                ]
            ]);
        });

        Route::get('attempts', function (Request $request) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'attempts' => $request->user()->attempts()
                        ->with(['question.topic'])
                        ->latest()
                        ->get()
                ]
            ]);
        });
    });

    // Physics Topics routes - berdasarkan PhysicsTopic model
    Route::prefix('topics')->group(function () {
        Route::get('/', function () {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'topics' => \App\Models\PhysicsTopic::where('is_active', true)
                        ->orderBy('order_index')
                        ->get()
                ]
            ]);
        });

        Route::get('{slug}', function ($slug) {
            $topic = \App\Models\PhysicsTopic::where('slug', $slug)
                ->where('is_active', true)
                ->firstOrFail();

            return response()->json([
                'status' => 'success',
                'data' => ['topic' => $topic]
            ]);
        });

        Route::get('{slug}/questions', function ($slug) {
            $topic = \App\Models\PhysicsTopic::where('slug', $slug)->firstOrFail();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'questions' => $topic->questions()
                        ->where('is_active', true)
                        ->get()
                ]
            ]);
        });
    });

    // Achievements routes - berdasarkan Achievement model
    Route::prefix('achievements')->group(function () {
        Route::get('/', function () {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'achievements' => \App\Models\Achievement::where('is_active', true)
                        ->get()
                ]
            ]);
        });
    });

    // Daily Challenge routes - berdasarkan DailyChallenge model
    Route::prefix('challenges')->group(function () {
        Route::get('daily', function () {
            $challenge = \App\Models\DailyChallenge::whereDate('challenge_date', today())
                ->where('is_active', true)
                ->with('question')
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => ['challenge' => $challenge]
            ]);
        });

        Route::get('/', function () {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'challenges' => \App\Models\DailyChallenge::where('is_active', true)
                        ->latest('challenge_date')
                        ->get()
                ]
            ]);
        });
    });
});

// Fallback route untuk API
Route::fallback(function () {
    return response()->json([
        'status' => 'error',
        'message' => 'API endpoint not found'
    ], 404);
});