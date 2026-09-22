export async function up(knex) {
  await knex.schema.createTable('referral_candidates', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.string('name', 180).notNullable();
    table.string('current_role', 180);
    table.string('company', 180).notNullable();
    table.string('location', 180);
    table.text('profile_url').notNullable();
    table.text('avatar_url');
    table.text('bio');
    table.string('source', 50).notNullable();
    table.string('source_candidate_id', 255).notNullable();
    table.integer('relevance_score').notNullable().defaultTo(0);
    table.jsonb('relevance_reasons').notNullable().defaultTo('[]');
    table.boolean('verified_by_user').notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.unique(['user_id', 'job_id', 'source', 'source_candidate_id']);
    table.index(['user_id', 'job_id', 'relevance_score']);
  });

  await knex.schema.createTable('referral_search_runs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.string('source', 50).notNullable();
    table.string('company', 180).notNullable();
    table.integer('result_count').notNullable().defaultTo(0);
    table.integer('new_count').notNullable().defaultTo(0);
    table.integer('rate_limit_remaining');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'job_id', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('referral_search_runs');
  await knex.schema.dropTableIfExists('referral_candidates');
}
