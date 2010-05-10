Ext.onReady(function() {
  var store = new Ext.data.JsonStore({
    url: "getdata.php",
    root: "rows",
    baseParams: {limit: 10},
    autoLoad: true,
    fields: [
      {name: 'company'},
      {name: 'price'},
      {name: 'change'}
    ]
  });
  
  // Custom filtering with remote store.
  // Each time filers change, send values of each filter field to
  // server and reload store with the result.
  var filterRow = new Ext.ux.grid.FilterRow({
    autoFilter: false,
    listeners: {
      change: function(data) {
        store.load({
          params: data
        });
      }
    }
  });
  
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
        }
      },
      {
        header: 'Change',
        width: 75,
        sortable: true,
        dataIndex: 'change',
        filter: {
          // hide filtering icon, just to demonstrate the possibility
          showFilterIcon: false
        }
      }
    ],
    plugins: [filterRow],
    stripeRows: true,
    autoExpandColumn: 'company',
    height: 350,
    width: 450,
    title: 'Filtering with remote store',
    renderTo: "remote-grid-container"
  });
  
});

