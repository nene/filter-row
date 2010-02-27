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
 * 
 * Grid plugin that adds filtering row below grid header.
 * 
 * <p>To add filtering to column, define "filter" property in column
 * to be FilterRowFilter configuration object or an instance of it.
 * 
 * <p>Example:
 * 
 * <pre><code>
    columns: [
      {
        header: 'Company',
        width: 160,
        dataIndex: 'company',
        filter: {
          field: new Ext.form.TextField({enableKeyEvents: true}),
          events: ["keyup"],
          test: "^/{0}/i"
        }
      },
      ...
    ]
 * </code></pre>
 */
Ext.ux.grid.FilterRow = Ext.extend(Object, {
  init: function(grid) {
    this.grid = grid;
    var cm = grid.getColumnModel();
    var view = grid.getView();
    
    // convert all filter configs to FilterRowFilter instances
    var Filter = Ext.ux.grid.FilterRowFilter;
    this.eachFilterColumn(function(col) {
      if (!(col.filter instanceof Filter)) {
        col.filter = new Filter(col.filter);
      }
      col.filter.on("change", this.onFieldChange, this);
    });
    
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
    this.eachFilterColumn(function(col) {
      var editor = col.filter.getField();
      if (editor && editor.rendered) {
        var el = col.filter.getFieldDom();
        var parentNode = el.parentNode;
        parentNode.removeChild(el);
      }
    });
    this.applyTemplate();
  },
  
  renderFields: function() {
    this.eachFilterColumn(function(col) {
      var filterDiv = Ext.get(this.getFilterDivId(col.id));
      var editor = col.filter.getField();
      editor.setWidth(col.width - 2);
      if (editor.rendered) {
        filterDiv.appendChild(col.filter.getFieldDom());
      }
      else {
        editor.render(filterDiv);
      }
    });
  },
  
  onFieldChange: function() {
    this.grid.getStore().filterBy(this.createFilter());
  },
  
  // Creates store filtering function by combining
  // all "test" predicates.
  createFilter: function() {
    var tests = [];
    this.eachFilterColumn(function(col) {
      var p = col.filter.createPredicate(col.dataIndex);
      if (p) {
        tests.push(p);
      }
    });
    
    return function(record) {
      for (var i=0; i<tests.length; i++) {
        if (!tests[i](record)) {
          return false;
        }
      }
      return true;
    };
  },
  
  onColumnWidthChange: function(cm, colIndex, newWidth) {
    var col = cm.getColumnById(cm.getColumnId(colIndex));
    if (col.filter) {
      this.resizeFilterField(col, newWidth);
    }
  },
  
  // When grid has forceFit: true, then all columns will be resized
  // when grid resized or column added/removed.
  resizeAllFilterFields: function() {
    var cm = this.grid.getColumnModel();
    this.eachFilterColumn(function(col, i) {
      this.resizeFilterField(col, cm.getColumnWidth(i));
    });
  },
  
  // Resizes filter field according to the width of column
  resizeFilterField: function(column, newColumnWidth) {
    var editor = column.filter.getField();
    editor.setWidth(newColumnWidth - 2);
  },
  
  // Returns HTML ID of element containing filter div
  getFilterDivId: function(columnId) {
    return this.grid.id + '-filter-' + columnId;
  },
  
  // Iterates over each column that has filter
  eachFilterColumn: function(func) {
    this.eachColumn(function(col, i) {
      if (col.filter) {
        func.call(this, col, i);
      }
    });
  },
  
  // Iterates over each column in column config array
  eachColumn: function(func) {
    Ext.each(this.grid.getColumnModel().config, func, this);
  }
});

/**
 * @class Ext.ux.grid.FilterRowFilter
 * @extends Ext.util.Observable
 * 
 * This class encapsulates the definition of filter for one column.
 */
Ext.ux.grid.FilterRowFilter = Ext.extend(Ext.util.Observable, {
  /**
   * @cfg {Ext.form.Field} field
   * Instance of some form field to use for filtering, or just a
   * config object - xtype will default to "textfield".  Defaults to
   * TextField with enableKeyEvents set to true.
   */
  field: undefined,
  
  /**
   * @cfg {[String]} events
   * 
   * Names of events to listen from this field.  Each time one of the
   * events is heard, FilterRow will filter the grid.  By default it
   * contains the "keyup" event to provide useful default together with
   * the default TextField.
   */
  events: ["keyup"],
  
  /**
   * @cfg {String/Function} test
   * Determines how this column is filtered.
   * 
   * <p>When it's a string like "/^{0}/i", a regular expression filter
   * is created - substituting "{0}" with current value from field.
   * 
   * <p>When it's a function, it will be called with two arguments:
   * filterValue (the current value of field) and value (the value
   * from record at dataIndex).  When function returns true, the row
   * will be filtered in, otherwise excluded from grid view.
   * 
   * <p>Defaults to "/^{0}/i".
   */
  test: "/^{0}/i",
  
  /**
   * @cfg {Object} scope
   * Scope for the test function.
   */
  scope: undefined,
  
  constructor: function(config) {
    Ext.apply(this, config);
    
    if (!this.field) {
      this.field = new Ext.form.TextField({enableKeyEvents: true});
    }
    else if (!(this.field instanceof Ext.form.Field)) {
      this.field = Ext.create(this.field, "textfield");
    }
    
    this.addEvents(
      /**
       * @event change
       * Fired when ever one of the events listed in "events" config
       * option is fired by field.
       */
      "change"
    );
    Ext.each(this.events, function(event) {
      this.field.on(event, this.fireChangeEvent, this);
    }, this);
  },
  
  fireChangeEvent: function() {
    this.fireEvent("change");
  },
  
  /**
   * Returns the field of this filter.
   * 
   * @return {Ext.form.Field}
   */
  getField: function() {
    return this.field;
  },
  
  /**
   * Returns DOM Element that is the root element of form field.
   * 
   * <p>For most fields, this will be the "el" property, but
   * TriggerField and it's descendants will wrap "el" inside another
   * div called "wrap".
   * 
   * @return {HTMLElement}
   */
  getFieldDom: function() {
    return this.field.wrap ? this.field.wrap.dom : this.field.el.dom;
  },
  
  /**
   * Creates predicate function for filtering the column associated
   * with this filter.
   * 
   * @param {String} dataIndex
   * @return {Function}
   */
  createPredicate: function(dataIndex) {
    var test = this.test;
    var filterValue = this.field.getValue();
    
    // is test a regex string?
    if (typeof test === "string" && test.match(/^\/.*\/[img]*$/)) {
      return this.createRegExpPredicate(test, filterValue, dataIndex);
    }
    else {
      // otherwise assume it's a function
      var scope = this.scope;
      return function(r) {
        return test.call(scope, filterValue, r.get(dataIndex));
      };
    }
  },
  
  createRegExpPredicate: function(reString, filterValue, dataIndex) {
    // don't filter the column at all when field is empty
    if (filterValue === "") {
      return false;
    }
    
    var regex = this.createRegExp(reString, filterValue);
    return function(r) {
      return regex.test(r.get(dataIndex));
    };
  },
  
  // Given string "/^{0}/i" and value "foo" creates regex: /^foo/i
  createRegExp: function(reString, value) {
    // parse the reString into pattern and flags
    var m = reString.match(/^\/(.*)\/([img]*)$/);
    var pattern = m[1];
    var flags = m[2];
    // Create new RegExp substituting value inside pattern
    return new RegExp(String.format(pattern, Ext.escapeRe(value)), flags);
  }
});



