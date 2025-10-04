<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('simulation_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('simulation_question_id')->constrained()->onDelete('cascade');
            $table->json('user_answer'); // Applied force, calculated values, dll
            $table->json('correct_answer');
            $table->boolean('is_correct');
            $table->integer('score_earned');
            $table->integer('attempt_number');
            $table->float('time_taken')->nullable(); // dalam detik
            $table->json('simulation_data')->nullable(); // Data simulasi lengkap
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulation_attempts');
    }
};
