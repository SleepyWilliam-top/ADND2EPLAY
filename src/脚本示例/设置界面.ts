import 界面 from './设置界面.vue';

const app = createApp(界面).use(createPinia());

$(() => {
  const $app = createScriptIdDiv();
  $('#extensions_settings2').append($app);
  teleportStyle();
  app.mount($app[0]);
});

<<<<<<< HEAD
$(window).on('unload', () => {
=======
$(window).on('pagehide', () => {
>>>>>>> 8d88568a324a98f36d542d253ca61d6f5e5ee4a3
  app.unmount();
  deteleportStyle();
  destroyScriptIdDiv();
});

function teleportStyle() {
  if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) {
    return;
  }
  const $div = $(`<div>`).attr('script_id', getScriptId()).append($(`head > style`, document).clone());
  $('head').append($div);
}

function deteleportStyle() {
  $(`head > div[script_id="${getScriptId()}"]`).remove();
}

function createScriptIdDiv(): JQuery<HTMLDivElement> {
  return $('<div>').attr('script_id', getScriptId()) as JQuery<HTMLDivElement>;
}

function destroyScriptIdDiv(): void {
  $(`div[script_id="${getScriptId()}"]`).remove();
}
