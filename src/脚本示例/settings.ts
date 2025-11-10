const Settings = z
  .object({
    button_selected: z.boolean().default(false),
  })
  .prefault({});

export const useSettingsStore = defineStore('settings', () => {
<<<<<<< HEAD
  const settings = ref(validateInplace(Settings, getVariables({ type: 'script', script_id: getScriptId() })));
=======
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
>>>>>>> 5222cd67a858e8df734db29241ac1f211ca14bca

  watch(
    settings,
    new_settings => {
<<<<<<< HEAD
      insertOrAssignVariables(toRaw(new_settings), { type: 'script', script_id: getScriptId() });
=======
      insertOrAssignVariables(klona(new_settings), { type: 'script', script_id: getScriptId() });
>>>>>>> 5222cd67a858e8df734db29241ac1f211ca14bca
    },
    { immediate: true, deep: true },
  );
  return {
    settings,
  };
});
<<<<<<< HEAD

function validateInplace<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = parsePrettified(schema, data);
  return _.assign(data, result) as T;
}

function parsePrettified<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw Error(z.prettifyError(result.error));
  }
  return result.data;
}
=======
>>>>>>> 5222cd67a858e8df734db29241ac1f211ca14bca
