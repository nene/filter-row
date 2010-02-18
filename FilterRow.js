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
    var view = grid.getView();
    
    this.applyTemplate();
    
    var gridHandlers = {
      scope: this,
      render: this.renderFields,
      staterestore: this.onColumnChange
    };
    
    if (this.addContextMenu) {
      gridHandlers.contextmenu = this.onContextMenu;
    }
    grid.on(gridHandlers);
    
    view.on({
      scope: this,
      'beforerefresh': this.onColumnChange,
      'refresh': this.renderFields
    });
    
    // For autoExpand
    view.onColumnWidthUpdated = view.onColumnWidthUpdated.createSequence(function(col, w) {
      this.syncFields(col, w);
    }, this);
    
    var cm = grid.getColumnModel();
    cm.on({
      scope: this,
      'widthchange': this.onColumnWidthChange,
      'hiddenchange': this.onColumnHiddenChange
    });
  },
  
  onColumnHiddenChange: function(cm, colIndex, hidden) {
    var gridId = this.grid.id;
    var col = cm.getColumnById(cm.getColumnId(colIndex));
    var editorDiv = Ext.get(gridId + '-filter-' + col.id);
    if (editorDiv) {
      editorDiv.parent().dom.style.display = hidden ? 'none' : '';
    }
  },
  
  applyTemplate: function() {
    var grid = this.grid;
    var view = grid.getView();
    var cols = grid.getColumnModel().config;
    
    var colTpl = "";
    Ext.each(cols, function(col) {
      var filterDivId = grid.id + "-filter-" + col.id;
      var style = col.hidden ? " style='display:none'" : "";
      colTpl += '<td' + style + '><div class="x-small-editor" id="' + filterDivId + '"></div></td>';
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
  },
  
  onColumnChange: function() {
    var grid = this.grid;
    var cm = grid.getColumnModel();
    var cols = cm.config;
    var gridId = grid.id;
    Ext.each(cols, function(col) {
      var editor = Ext.getCmp(gridId + '-filter-editor-' + col.id);
      if (editor && editor.rendered) {
        var el = editor.el.dom;
        var parentNode = el.parentNode;
        parentNode.removeChild(el);
      }
    }, this);
    this.applyTemplate();
  },
  
  renderFields: function() {
    var grid = this.grid;
    var cm = grid.getColumnModel();
    var cols = cm.config;
    var gridId = grid.id;
    Ext.each(cols, function(col) {
      var filterDiv = Ext.get(gridId + "-filter-" + col.id);
      var editor = Ext.getCmp(gridId + '-filter-editor-' + col.id);
      if (editor) {
        editor.setWidth(col.width - 2);
        if (editor.rendered) {
          filterDiv.appendChild(editor.el);
        } else {
          if (editor.getXType() == 'combo') {
            editor.on('select', this.onChange, this);
          } else {
            editor.on('change', this.onChange, this);
          }
          editor.render(filterDiv);
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
  
  onColumnWidthChange: function(colModel, colIndex, newWidth) {
    this.syncFields(colIndex, newWidth);
  },
  
  syncFields: function(colIndex, newWidth) {
    var grid = this.grid;
    var cm = grid.getColumnModel();
    var col = cm.getColumnById(cm.getColumnId(colIndex));
    var editor = Ext.getCmp(grid.id + '-filter-editor-' + col.id);
    newWidth = parseInt(newWidth);
    if (editor) {
      editor.setWidth(newWidth - 2);
    }
  }
});
