export async function up(knex) {
  await knex.schema.alterTable('applications', (table) => {
    table.dropForeign('resume_id');
  });
  await knex.schema.alterTable('applications', (table) => {
    table.foreign('resume_id').references('id').inTable('resumes').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('applications', (table) => {
    table.dropForeign('resume_id');
  });
  await knex.schema.alterTable('applications', (table) => {
    table.foreign('resume_id').references('id').inTable('resumes').onDelete('RESTRICT');
  });
}
