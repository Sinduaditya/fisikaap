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
        Schema::create('simulation_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('physics_topic_id')->constrained()->onDelete('cascade');
            $table->text('question_text');
            $table->string('simulation_type'); // newton_second_law, kinetic_energy, momentum
            $table->json('parameters'); // mass, velocity, friction, dll
            $table->json('evaluation_criteria'); // target_variable, target_value, tolerance
            $table->json('hints')->nullable(); // Array of hints
            $table->integer('max_score')->default(100);
            $table->enum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }       

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulation_questions');
    }
};
