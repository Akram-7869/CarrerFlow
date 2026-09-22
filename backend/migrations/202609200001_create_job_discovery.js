export async function up(knex) {
  await knex.schema.alterTable('jobs', (table) => {
    table.string('source_job_id', 255);
    table.timestamp('posted_at', { useTz: true });
    table.boolean('remote').notNullable().defaultTo(false);
    table.jsonb('tags').notNullable().defaultTo('[]');
    table.string('job_hash', 64);

    table.unique(['user_id', 'source', 'source_job_id']);
    table.index(['user_id', 'source', 'posted_at']);
    table.index(['user_id', 'job_hash']);
  });

  await knex.schema.createTable('job_search_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('roles').notNullable().defaultTo('[]');
    table.jsonb('locations').notNullable().defaultTo('[]');
    table.jsonb('work_modes').notNullable().defaultTo('["remote","hybrid","onsite"]');
    table.jsonb('experience_levels').notNullable().defaultTo('[]');
    table.integer('posted_within_hours').notNullable().defaultTo(168);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('job_discovery_runs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('source', 50).notNullable();
    table.jsonb('filters').notNullable();
    table.integer('scanned_count').notNullable().defaultTo(0);
    table.integer('matched_count').notNullable().defaultTo(0);
    table.integer('new_count').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('job_discovery_runs');
  await knex.schema.dropTableIfExists('job_search_preferences');
  await knex.schema.alterTable('jobs', (table) => {
    table.dropUnique(['user_id', 'source', 'source_job_id']);
    table.dropIndex(['user_id', 'source', 'posted_at']);
    table.dropIndex(['user_id', 'job_hash']);
    table.dropColumns('source_job_id', 'posted_at', 'remote', 'tags', 'job_hash');
  });
}
