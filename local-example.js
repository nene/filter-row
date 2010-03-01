Ext.onReady(function() {
  var store = new Ext.data.JsonStore({
    url: "getdata.php",
    root: "rows",
    autoLoad: true,
    fields: [
      {name: 'company'},
      {name: 'price'},
      {name: 'change'}
    ]
  });
  store.load();
  
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
          events: ["select"],
          test: function(filterValue, value) {
            return filterValue === "-" || filterValue === value;
          }
        }
      }
    ],
    plugins: ["filterrow"],
    stripeRows: true,
    autoExpandColumn: 'company',
    height: 350,
    width: 450,
    title: 'Filtering with local store',
    renderTo: "local-grid-container"
  });
  
});

