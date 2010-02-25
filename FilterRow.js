/*!
 * Ext JS FilterRow plugin v0.2
 * http://github.com/nene/filter-row
 *
 * Copyright 2010 Rene Saarsoo
 * Licensed under GNU General Public License v3.
 * http://www.gnu.org/licenses/
 */
Ext.namespace('Ext.ux.grid');

/**
 * @class Ext.ux.grid.FilterRow
 * @extends Ext.util.Observable
 * 
 * Grid plugin that adds filtering row below grid header.
 * 
 * <p>To add filtering to column, define "filter" property in column
 * config to be an object with the following properties:
 * 
 * <ul>
 * <li>field - an instance of a form field component.
 * <li>events - array of event names to listen from this field.
 * Each time one of the events is heard, FilterRow will fire its "change"
 * event. (Defaults to ["change"], which should be implemented by all
 * Ext.form.Field descendants.)
 * <li>test - function that returns true when record should be filtered
 * in and false when not.
 * </ul>
 * 
 * <pre><code>
    columns: [
      {
        header: 'Company',
        width: 160,
        dataIndex: 'company',
        filter: {
          field: new Ext.form.TextField(),
          events: ["keyup", "specialkey"],
          test: function(value, fieldValue) {
            return value === fieldValue;
          }
        }
      },
      ...
    ]
 * </code></pre>
 */
Ext.ux.grid.FilterRow = Ext.extend(Ext.util.Observable, {
  constructor: function(config) {
    Ext.apply(this, config);
    
    this.addEvents(
      /**
       * @event change
       * Fired when any one of the fields is changed.
       * @param {Object} filterValues object containing values of all
       * filter-fields.  When column has "id" defined, then property
       * with that ID will hold filter value.  When no "id" defined,
       * then numeric indexes are used, starting from zero.
       */
      "change"
    );
    
    Ext.ux.grid.FilterRow.superclass.constructor.call(this);
  },
  
  init: function(grid) {
    this.grid = grid;
    var cm = grid.getColumnModel();
    var view = grid.getView();
    
    this.applyTemplate();
    // add class for attatching plugin specific styles
    grid.addClass('filter-row-grid');
    
    // when grid initially rendered
    grid.on("render", this.renderFields, this);
    
    // when Ext grid state restored (untested)
    grid.on("staterestore", this.onColumnChange, this);
    
    // when the width of the whole grid changed
    grid.on("resize", this.resizeAllFilterFields, this);
    // when column width programmatically changed
    cm.on("widthchange", this.onColumnWidthChange, this);
    // Monitor changes in column widths
    // newWidth will contain width like "100px", so we use parseInt to get rid of "px"
    view.onColumnWidthUpdated = view.onColumnWidthUpdated.createSequence(function(colIndex, newWidth) {
      this.onColumnWidthChange(this.grid.getColumnModel(), colIndex, parseInt(newWidth, 10));
    }, this);
    
    // before column is moved, remove fields, after the move add them back
    cm.on("columnmoved", this.onColumnChange, this);
    view.afterMove = view.afterMove.createSequence(this.renderFields, this);
    
    // When column hidden or shown
    cm.on("hiddenchange", this.onColumnHiddenChange, this);
  },
  
  onColumnHiddenChange: function(cm, colIndex, hidden) {
    var filterDiv = Ext.get(this.getFilterDivId(cm.getColumnId(colIndex)));
    if (filterDiv) {
      filterDiv.parent().dom.style.display = hidden ? 'none' : '';
    }
    this.resizeAllFilterFields();
  },
  
  applyTemplate: function() {
    var colTpl = "";
    this.eachColumn(function(col) {
      var filterDivId = this.getFilterDivId(col.id);
      var style = col.hidden ? " style='display:none'" : "";
      colTpl += '<td' + style + '><div class="x-small-editor" id="' + filterDivId + '"></div></td>';
    });
    
    var headerTpl = new Ext.Template(
      '<table border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
      '<thead><tr class="x-grid3-hd-row">{cells}</tr></thead>',
      '<tbody><tr class="filter-row-header">',
      colTpl,
      '</tr></tbody>',
      "</table>"
    );
    
    var view = this.grid.getView();
    Ext.applyIf(view, { templates: {} });
    view.templates.header = headerTpl;
  },
  
  onColumnChange: function() {
    this.eachColumn(function(col) {
      var editor = this.getFilterField(col);
      if (editor && editor.rendered) {
        var el = this.getFilterFieldDom(editor);
        var parentNode = el.parentNode;
        parentNode.removeChild(el);
      }
    });
    this.applyTemplate();
  },
  
  renderFields: function() {
    this.eachColumn(function(col) {
      var filterDiv = Ext.get(this.getFilterDivId(col.id));
      var editor = this.getFilterField(col);
      if (editor) {
        editor.setWidth(col.width - 2);
        if (editor.rendered) {
          filterDiv.appendChild(this.getFilterFieldDom(editor));
        }
        else {
          Ext.each(col.filter.events || ["change"], function(eventName) {
            editor.on(eventName, this.onFieldChange, this);
          }, this);
          
          editor.render(filterDiv);
        }
      }
    });
  },
  
  onFieldChange: function() {
    this.grid.getStore().filterBy(this.createFilter());
  },
  
  createFilter: function() {
    var eq = function(a,b){return a===b;};
    
    var tests = {};
    this.eachColumn(function(col) {
      if (!col.hidden && col.filter) {
        var t = col.filter.test || eq;
        var editor = this.getFilterField(col);
        var fieldValue = editor.getValue();
        tests[col.id] = function(v){ return t(v, fieldValue); };
      }
    });
    
    return function(record) {
      for (var i in tests) {
        if (!tests[i](record.get(i))) {
          return false;
        }
      }
      return true;
    };
  },
  
  getData: function() {
    var data = {};
    this.eachColumn(function(col) {
      if (!col.hidden) {
        var editor = this.getFilterField(col);
        if (editor) {
          data[col.id] = editor.getValue();
        }
      }
    });
    return data;
  },
  
  onColumnWidthChange: function(cm, colIndex, newWidth) {
    this.resizeFilterField(cm.getColumnById(cm.getColumnId(colIndex)), newWidth);
  },
  
  // When grid has forceFit: true, then all columns will be resized
  // when grid resized or column added/removed.
  resizeAllFilterFields: function() {
    var cm = this.grid.getColumnModel();
    this.eachColumn(function(col, i) {
      this.resizeFilterField(col, cm.getColumnWidth(i));
    });
  },
  
  // Resizes filter field according to the width of column
  resizeFilterField: function(column, newColumnWidth) {
    var editor = this.getFilterField(column);
    if (editor) {
      editor.setWidth(newColumnWidth - 2);
    }
  },
  
  // Returns HTML ID of element containing filter div
  getFilterDivId: function(columnId) {
    return this.grid.id + '-filter-' + columnId;
  },
  
  // returns filter field of a column
  getFilterField: function(column) {
    return column.filter && column.filter.field;
  },
  
  /**
   * Returns DOM Element that is the root element of form field.
   * 
   * For most fields, this will be the "el" property, but TriggerField
   * and it's descendants will wrap "el" inside another div called
   * "wrap".
   * @private
   */
  getFilterFieldDom: function(field) {
    return field.wrap ? field.wrap.dom : field.el.dom;
  },
  
  // Iterates over each column in column config array
  eachColumn: function(func) {
    Ext.each(this.grid.getColumnModel().config, func, this);
  }
  
});


