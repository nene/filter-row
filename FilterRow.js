Ext.namespace('Ext.ux.grid');

Ext.ux.grid.FilterRow = function(config) {
  Ext.apply(this, config);
  
  this.addEvents(
    "change"
  );
  
  Ext.ux.grid.FilterRow.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.grid.FilterRow, Ext.util.Observable, {
  addContextMenu: true,
  
  init: function(grid) {
    this.grid = grid;
    
    var cols = grid.getColumnModel().config;
    
    var colTpl = "";
    
    Ext.each(cols, function(col) {
      if (!col.hidden) {
        var filterDivId = grid.id + "-filter-" + col.id;
        colTpl += '<td><div class="x-small-editor" id="' + filterDivId + '"></div></td>';
      }
    });
    
    var headerTpl = new Ext.Template(
      '<table border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
      '<thead><tr class="x-grid3-hd-row">{cells}</tr></thead>',
      '<tbody><tr class="new-task-row">',
      colTpl,
      '</tr></tbody>',
      "</table>"
    );
    
    var view = grid.getView();
    Ext.applyIf(view, { templates: {} });
    view.templates.header = headerTpl;
    
    grid.on('resize', this.syncFields, this);
    grid.on('columnresize', this.syncFields, this);
    grid.on('render', this.renderFields, this);
    if (this.addContextMenu) {
      grid.on('contextmenu', this.onContextMenu, this);
    }
    Ext.apply(grid, {
      enableColumnHide: false,
      enableColumnMove: false
    });
  },
  
  renderFields: function() {
    var grid = this.grid;
    var cm = grid.getColumnModel();
    var cols = cm.config;
    var gridId = grid.id;
    Ext.each(cols, function(col) {
      if (!col.hidden) {
        var filterDivId = gridId + "-filter-" + col.id;
        var editor = Ext.getCmp(gridId + '-filter-editor-' + col.id);
        if (editor) {
          if (editor.getXType() == 'combo') {
            editor.on('select', this.onChange, this);
          } else {
            editor.on('change', this.onChange, this);
          }
          editor.render(filterDivId);
        }
      }
    }, this);
  },
  
  onContextMenu: function(e) {
    if (!this.contextMenu) {
      this.contextMenu = new Ext.menu.Menu({
        id: 'gridCtxMenu',
        items: [{ text: 'Remove filters', handler: this.clearFilters, scope: this}]
      });
    }
    e.stopEvent();
    this.contextMenu.showAt(e.getXY());
  },
  
  getData: function() {
    var grid = this.grid;
    var cm = grid.getColumnModel();
    var cols = cm.config;
    var gridId = grid.id;
    var data = {};
    Ext.each(cols, function(col) {
      if (!col.hidden) {
        var filterDivId = gridId + "-filter-" + col.id;
        var editor = Ext.getCmp(gridId + '-filter-editor-' + col.id);
        if (editor) {
          data[col.id] = editor.getValue();
        }
      }
    });
    return data;
  },
  
  onChange: function() {
    this.fireEvent("change", { filter: this, data: this.getData() });
  },
  
  clearFilters: function() {
    this.fireEvent("change", { filter: this, data: {} });
  },
  
  syncFields: function() {
    var grid = this.grid;
    var cm = grid.getColumnModel();
    var cols = cm.config;
    var gridId = grid.id;
    Ext.each(cols, function(col) {
      if (!col.hidden) {
        var filterDivId = gridId + "-filter-" + col.id;
        var editor = Ext.getCmp(gridId + '-filter-editor-' + col.id);
        if (editor) {
          editor.setSize(col.width - 2);
        }
      }
    });
  }
});
