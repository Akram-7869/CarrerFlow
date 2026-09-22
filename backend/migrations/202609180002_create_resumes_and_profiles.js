export async function up(knex) {
  await knex.schema.createTable('resumes', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 150).notNullable();
    table.string('original_filename', 255).notNullable();
    table.string('stored_filename', 255).notNullable();
    table.text('file_path').notNullable();
    table.string('mime_type', 120).notNullable();
    table.integer('file_size').notNullable();
    table.string('file_hash', 64).notNullable();
    table.string('status', 30).notNullable().defaultTo('uploaded');
    table.text('parsed_text');
    table.jsonb('structured_data');
    table.string('extraction_model', 100);
    table.string('extraction_version', 30);
    table.text('extraction_error');
    table.timestamps(true, true);

    table.unique(['user_id', 'file_hash']);
    table.index(['user_id', 'created_at']);
    table.index(['user_id', 'status']);
  });

  await knex.schema.createTable('career_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.string('full_name', 150);
    table.string('email', 320);
    table.string('phone', 50);
    table.string('location', 180);
    table.text('linkedin_url');
    table.text('github_url');
    table.text('portfolio_url');
    table.text('summary');
    table.decimal('years_experience', 5, 2);
    table.uuid('source_resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('career_profile_id').notNullable().references('id').inTable('career_profiles').onDelete('CASCADE');
    table.string('name', 120).notNullable();
    table.string('level', 50);
    table.decimal('years_experience', 5, 2);
    table.text('evidence_text');
    table.uuid('source_resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.boolean('verified_by_user').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.index(['career_profile_id']);
  });

  await knex.schema.createTable('experiences', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('career_profile_id').notNullable().references('id').inTable('career_profiles').onDelete('CASCADE');
    table.string('company', 180).notNullable();
    table.string('job_title', 180).notNullable();
    table.string('location', 180);
    table.string('start_date', 50);
    table.string('end_date', 50);
    table.boolean('is_current').notNullable().defaultTo(false);
    table.text('description');
    table.jsonb('highlights').notNullable().defaultTo('[]');
    table.jsonb('technologies').notNullable().defaultTo('[]');
    table.text('evidence_text');
    table.uuid('source_resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.boolean('verified_by_user').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.index(['career_profile_id']);
  });

  await knex.schema.createTable('education', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('career_profile_id').notNullable().references('id').inTable('career_profiles').onDelete('CASCADE');
    table.string('institution', 220).notNullable();
    table.string('degree', 180);
    table.string('field_of_study', 180);
    table.string('location', 180);
    table.string('start_date', 50);
    table.string('end_date', 50);
    table.string('grade', 80);
    table.text('description');
    table.text('evidence_text');
    table.uuid('source_resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.boolean('verified_by_user').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.index(['career_profile_id']);
  });

  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('career_profile_id').notNullable().references('id').inTable('career_profiles').onDelete('CASCADE');
    table.string('name', 180).notNullable();
    table.text('description');
    table.text('url');
    table.string('start_date', 50);
    table.string('end_date', 50);
    table.jsonb('highlights').notNullable().defaultTo('[]');
    table.jsonb('technologies').notNullable().defaultTo('[]');
    table.text('evidence_text');
    table.uuid('source_resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.boolean('verified_by_user').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.index(['career_profile_id']);
  });

  await knex.schema.createTable('certifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('career_profile_id').notNullable().references('id').inTable('career_profiles').onDelete('CASCADE');
    table.string('name', 220).notNullable();
    table.string('issuer', 180);
    table.string('issue_date', 50);
    table.string('expiry_date', 50);
    table.string('credential_id', 150);
    table.text('credential_url');
    table.text('evidence_text');
    table.uuid('source_resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.boolean('verified_by_user').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.index(['career_profile_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('certifications');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('education');
  await knex.schema.dropTableIfExists('experiences');
  await knex.schema.dropTableIfExists('skills');
  await knex.schema.dropTableIfExists('career_profiles');
  await knex.schema.dropTableIfExists('resumes');
}
