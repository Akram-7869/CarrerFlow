export async function up(knex) {
  await knex.schema.createTable('resume_analyses', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('resume_id').notNullable().references('id').inTable('resumes').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('overall_score').notNullable();
    table.string('rating', 30).notNullable();
    table.integer('parsability_score').notNullable();
    table.integer('contact_score').notNullable();
    table.integer('structure_score').notNullable();
    table.integer('skills_score').notNullable();
    table.integer('experience_score').notNullable();
    table.integer('achievement_score').notNullable();
    table.integer('content_score').notNullable();
    table.jsonb('issues').notNullable().defaultTo('[]');
    table.jsonb('strengths').notNullable().defaultTo('[]');
    table.jsonb('suggestions').notNullable().defaultTo('[]');
    table.jsonb('metrics').notNullable().defaultTo('{}');
    table.string('analyzer_version', 30).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['resume_id', 'created_at']);
    table.index(['user_id', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('resume_analyses');
}
