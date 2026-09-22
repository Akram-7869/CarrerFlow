export async function up(knex) {
  await knex.schema.createTable('applications', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('resume_id').notNullable().references('id').inTable('resumes').onDelete('RESTRICT');
    table.uuid('resume_version_id').references('id').inTable('resume_versions').onDelete('SET NULL');
    table.uuid('job_resume_match_id').references('id').inTable('job_resume_matches').onDelete('SET NULL');
    table.uuid('resume_analysis_id').references('id').inTable('resume_analyses').onDelete('SET NULL');
    table.uuid('referral_candidate_id').references('id').inTable('referral_candidates').onDelete('SET NULL');
    table.uuid('referral_message_id').references('id').inTable('referral_messages').onDelete('SET NULL');
    table.string('status', 30).notNullable().defaultTo('preparing');
    table.text('notes');
    table.text('cover_letter');
    table.text('generated_cover_letter');
    table.jsonb('cover_letter_evidence_refs').notNullable().defaultTo('[]');
    table.jsonb('cover_letter_warnings').notNullable().defaultTo('[]');
    table.string('cover_letter_model', 100);
    table.string('cover_letter_version', 30);
    table.boolean('cover_letter_edited').notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.unique(['user_id', 'job_id']);
    table.index(['user_id', 'status', 'updated_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('applications');
}
