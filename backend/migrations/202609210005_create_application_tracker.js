export async function up(knex) {
  await knex.schema.alterTable('applications', (table) => {
    table.timestamp('applied_at', { useTz: true });
    table.timestamp('last_status_changed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('application_status_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('application_id').notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('from_status', 30);
    table.string('to_status', 30).notNullable();
    table.text('note');
    table.timestamp('occurred_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['application_id', 'occurred_at']);
    table.index(['user_id', 'occurred_at']);
  });

  await knex.schema.createTable('application_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('application_id').notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('event_type', 30).notNullable();
    table.string('title', 180).notNullable();
    table.timestamp('scheduled_at', { useTz: true }).notNullable();
    table.text('notes');
    table.timestamp('completed_at', { useTz: true });
    table.timestamps(true, true);

    table.index(['application_id', 'scheduled_at']);
    table.index(['user_id', 'scheduled_at']);
  });

  const existing = await knex('applications').select('id', 'user_id', 'status', 'created_at');
  if (existing.length) {
    await knex('application_status_history').insert(existing.map((application) => ({
      application_id: application.id,
      user_id: application.user_id,
      from_status: null,
      to_status: application.status,
      note: 'Application preparation created.',
      occurred_at: application.created_at,
      created_at: application.created_at,
    })));
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('application_events');
  await knex.schema.dropTableIfExists('application_status_history');
  await knex.schema.alterTable('applications', (table) => {
    table.dropColumns('applied_at', 'last_status_changed_at');
  });
}
