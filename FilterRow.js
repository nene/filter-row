/*!
 * Ext JS FilterRow plugin v0.5
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
 * to be FilterRowFilter configuration object or an instance of it.
 * 
 * <p>Example:
 * 
 * <pre><code>
var grid = new Ext.grid.GridPanel({
  columns: [
    {
      header: 'Name',
      dataIndex: 'name',
      // Filter by regular expression
      // {0} will be substituted with current field value
      filter: {
        test: "/{0}/i"
      }
    },
    {
      header: 'Age',
      dataIndex: 'age',
      filter: {
        // Show larger ages than the one entered to field
        test: function(filterValue, value) {
          return value > filterValue;
        }
      }
    }
  ],
  plugins: ["filterrow"],
  ...
});
 * </code></pre>
 */
Ext.ux.grid.FilterRow = Ext.extend(Ext.util.Observable, {
  /**
   * @cfg {Boolean} autoFilter
   * false, to turn automatic filtering off. (default true)
   */
  autoFilter: true,
  
  /**
   * @cfg {Boolean} refilterOnStoreUpdate
   * true to refilter store when records added/removed. (default false)
   */
  refilterOnStoreUpdate: false,
  
  constructor: function(conf) {
    Ext.apply(this, conf || {});
    
    this.addEvents(
      /**
       * @event change
       * Fired when any one of the fields is changed.
       * @param {Object} filterValues object containing values of all
       * filter-fields.  When column has "id" defined, then property
       * with that ID will hold filter value.  When no "id" defined,
       * then dataIndexes are used.  That is, you only need to specify
       * ID-s for columns, when two filters use the same dataIndex.
       */
      "change"
    );
    if (this.listeners) {
      this.on(this.listeners);
    }
  },
  
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
    
    // From Ext 3.3 onwards grid headers are also refreshed when store
    // is filtered/sorted/etc (anything that fires "datachanged").
    // So after each grid refresh we re-render all the fields and
    // focus the field that was previously focused.
    view.on("beforerefresh", this.rememberFocusedField, this);
    view.on("refresh", this.renderFields, this);
    
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
    
    if (this.refilterOnStoreUpdate) {
      this.respectStoreFilter();
    }
  },
  
  // Makes store add() and load() methods to respect filtering.
  respectStoreFilter: function() {
    var store = this.grid.getStore();
    
    // re-apply filter after store load
    store.on("load", this.refilter, this);
    
    // re-apply filter after adding stuff to store
    this.refilterAfter(store, "add");
    this.refilterAfter(store, "addSorted");
    this.refilterAfter(store, "insert");
  },
  
  // Appends refiltering action to after store method
  refilterAfter: function(store, method) {
    var filterRow = this;
    store[method] = store[method].createSequence(function() {
      if (this.isFiltered()) {
        filterRow.refilter();
      }
    });
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
      var icon = (col.filter && col.filter.showFilterIcon) ? "filter-row-icon" : "";
      colTpl += '<td' + style + '><div class="x-small-editor ' + icon + '" id="' + filterDivId + '"></div></td>';
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
  
  rememberFocusedField: function() {
    this.focusedField = false;
    this.eachFilterColumn(function(col) {
      if (col.filter.hasFocus()) {
        this.focusedField = col.filter;
      }
    });
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
    this.focusedField && this.focusedField.focus();
  },
  
  onFieldChange: function() {
    if (this.hasListener("change")) {
      this.fireEvent("change", this.getFilterData());
    }
    
    if (this.autoFilter) {
      this.grid.getStore().filterBy(this.getFilterFunction());
    }
  },
  
  // refilters the store with current filter.
  refilter: function() {
    this.grid.getStore().filterBy(this.getFilterFunction());
  },
  
  // collects values from all filter-fields into hash that maps column
  // dataindexes (or id-s) to filter values.
  getFilterData: function() {
    var data = {};
    this.eachFilterColumn(function(col) {
      // when column id is numeric, assume it's autogenerated and use
      // dataIndex.  Otherwise assume id is user-defined and use it.
      var name = (typeof col.id === "number") ? col.dataIndex : col.id;
      data[name] = col.filter.getFieldValue();
    });
    return data;
  },
  
  /**
   * Returns store filtering function for the current values in filter
   * fields.
   * 
   * @return {Function}  function to use with store.filterBy()
   */
  getFilterFunction: function() {
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
Ext.preg("filterrow", Ext.ux.grid.FilterRow);

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
   * @cfg {[String]} fieldEvents
   * 
   * Names of events to listen from this field.  Each time one of the
   * events is heard, FilterRow will filter the grid.  By default it
   * contains the "keyup" event to provide useful default together with
   * the default TextField.
   */
  fieldEvents: ["keyup"],
  
  /**
   * @cfg {String/Function} test
   * Determines how this column is filtered.
   * 
   * <p>When it's a string like "/^{0}/i", a regular expression filter
   * is created - substituting "{0}" with current value from field.
   * 
   * <p>When it's a function, it will be called with three arguments:
   * 
   * <ul>
   * <li>filterValue - the current value of field,
   * <li>value - the value from record at dataIndex,
   * <li>record - the record object itself.
   * </ul>
   * 
   * <p>When function returns true, the row will be filtered in,
   * otherwise excluded from grid view.
   * 
   * <p>Defaults to "/{0}/i".
   */
  test: "/{0}/i",
  
  /**
   * @cfg {Object} scope
   * Scope for the test function.
   */
  scope: undefined,
  
  /**
   * @cfg {Boolean} showFilterIcon
   * By default a magnifier-glass icon is shown inside filter field.
   * Set this to false, to disable that behaviour. (Default is true.)
   */
  showFilterIcon: true,
  
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
    Ext.each(this.fieldEvents, function(event) {
      this.field.on(event, this.fireChangeEvent, this);
    }, this);
    
    // We can't ask directly from Ext.form.Field if it has focus, so
    // we monitor focus and blur events to keep track of it.
    this.field.on("focus", this.onFocus, this);
    this.field.on("blur", this.onBlur, this);
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
   * Returns the value of filter field.
   * 
   * @return {Anything}
   */
  getFieldValue: function() {
    return this.field.getValue();
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
        return test.call(scope, filterValue, r.get(dataIndex), r);
      };
    }
  },
  
  createRegExpPredicate: function(reString, filterValue, dataIndex) {
    // don't filter the column at all when field is empty
    if (!filterValue) {
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
  },
  
  onFocus: function() {
    this.focused = true;
  },
  
  onBlur: function() {
    this.focused = false;
  },
  
  /**
   * True when field is currently focused.
   */
  hasFocus: function() {
    return this.focused;
  },
  
  /**
   * Focuses the field of filter.
   */
  focus: function() {
    this.field.focus();
  }
});



