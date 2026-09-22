export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('name', 100).notNullable();
    table.string('email', 320).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('token_hash', 64).notNullable().unique();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('revoked_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['expires_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
}
