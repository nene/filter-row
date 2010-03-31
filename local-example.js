Ext.onReady(function() {
  var Company = Ext.data.Record.create([
    'company',
    'price',
    'change'
  ]);
  
  var store = new Ext.data.JsonStore({
    url: "getdata.php",
    root: "rows",
    autoLoad: true,
    fields: Company
  });
  store.load();
  
  var filterRow = new Ext.ux.grid.FilterRow();
  
  var grid = new Ext.grid.GridPanel({
    store: store,
    columns: [
      {
        id: 'company',
        header: 'Company',
        width: 160,
        sortable: true,
        dataIndex: 'company',
        filter: {
          // test defaults to "/^{0}/i/"
        }
      },
      {
        header: 'Price',
        width: 75,
        sortable: true,
        renderer: 'usMoney',
        align: "right",
        dataIndex: 'price',
        filter: {
          // find prices greater than filter value
          test: function(filterValue, value) {
            return +value >= +filterValue;
          }
        }
      },
      {
        header: 'Change',
        width: 75,
        sortable: true,
        dataIndex: 'change',
        filter: {
          field: {
            xtype: "combo",
            mode: 'local',
            store: new Ext.data.ArrayStore({
              id: 0,
              fields: [
                'value'
              ],
              data: [['-'], ['up'], ['none'], ['down']]
            }),
            valueField: 'value',
            displayField: 'value',
            triggerAction: 'all',
            value: "-"
          },
          fieldEvents: ["select"],
          test: function(filterValue, value) {
            return filterValue === "-" || filterValue === value;
          }
        }
      }
    ],
    plugins: [filterRow],
    stripeRows: true,
    autoExpandColumn: 'company',
    height: 350,
    width: 450,
    title: 'Filtering with local store',
    renderTo: "local-grid-container",
    bbar: [
      // FilterRow doesn't solve the issue that new records added to
      // filtered store will not get filtered.  But it gives you
      // access to the current filtering function, which you can then
      // use to implement the reloading and adding.
      {
        text: "Reload",
        handler: function() {
          // after store is reloaded, reapply the filter
          store.on("load", function() {
            store.filterBy(filterRow.getFilterFunction());
          }, this, {single: true});
          
          store.load();
        }
      },
      {
        text: "Add",
        handler: function() {
          // Before adding you have to clear filters, otherwise
          // strange things can happen.
          store.clearFilter();
          
          store.add(new Company({
            company: "Google Inc",
            price: 150.7,
            change: "up"
          }));
          
          // after adding, reapply the filter
          store.filterBy(filterRow.getFilterFunction());
        }
      }
    ]
  });
  
});

