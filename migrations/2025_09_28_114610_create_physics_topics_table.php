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
        Schema::create('physics_topics', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Newton II, Energi Kinetik, Momentum
            $table->string('slug')->unique(); // newton_second_law, kinetic_energy, momentum
            $table->string('subtitle'); // F = m × a, Ek = ½mv², p = m × v
            $table->text('description');
            $table->enum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);
            $table->integer('estimated_duration'); // dalam menit
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('physics_topics');
    }
};
