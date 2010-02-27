Ext.onReady(function() {
  var store = new Ext.data.ArrayStore({
    fields: [
      {name: 'company'},
      {name: 'price'},
      {name: 'change'}
    ]
  });
  
  store.loadData([
    ['3m Co', 71.72, 'up'],
    ['Alcoa Inc', 29.01, 'down'],
    ['Altria Group Inc', 83.81, 'up'],
    ['American Express Company', 52.55, 'up'],
    ['American International Group, Inc.', 64.13, 'none'],
    ['AT&T Inc.', 31.61, 'up'],
    ['Boeing Co.', 75.43, 'up'],
    ['Caterpillar Inc.', 67.27, 'up'],
    ['Citigroup, Inc.', 49.37, 'down'],
    ['E.I. du Pont de Nemours and Company', 40.48, 'down'],
    ['Exxon Mobil Corp', 68.1, 'up'],
    ['General Electric Company', 34.14, 'up'],
    ['General Motors Corporation', 30.27, 'up'],
    ['Hewlett-Packard Co.', 36.53, 'none'],
    ['Honeywell Intl Inc', 38.77, 'down'],
    ['Intel Corporation', 19.88, 'down'],
    ['International Business Machines', 81.41, 'none'],
    ['Johnson & Johnson', 64.72, 'none'],
    ['JP Morgan & Chase & Co', 45.73, 'down'],
    ['McDonald\'s Corporation', 36.76, 'up'],
    ['Merck & Co.,  Inc.', 40.96, 'none'],
    ['Microsoft Corporation', 25.84, 'down'],
    ['Pfizer Inc', 27.96, 'down'],
    ['The Coca-Cola Company', 45.07, 'up'],
    ['The Home Depot,  Inc.', 34.64, 'down'],
    ['The Procter & Gamble Company', 61.91, 'up'],
    ['United Technologies Corporation', 63.26, 'none'],
    ['Verizon Communications', 35.57, 'up'],
    ['Wal-Mart Stores, Inc.', 45.45, 'down']
  ]);
  
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
          field: new Ext.form.TextField({enableKeyEvents: true}),
          events: ["keyup"]
        }
      },
      {
        header: 'Price',
        width: 75,
        sortable: true,
        renderer: 'usMoney',
        dataIndex: 'price',
        filter: {
          field: new Ext.form.TextField({enableKeyEvents: true}),
          events: ["keyup"],
          test: "/^{0}.?\.[0-9]+$/"
        }
      },
      {
        header: 'Change',
        width: 75,
        sortable: true,
        dataIndex: 'change',
        filter: {
          field: new Ext.form.ComboBox({
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
          }),
          events: ["select"],
          test: function(filterValue, value) {
            return filterValue === "-" || filterValue === value;
          }
        }
      }
    ],
    plugins: [new Ext.ux.grid.FilterRow()],
    stripeRows: true,
    autoExpandColumn: 'company',
    height: 350,
    width: 450,
    title: 'Grid with RowFilter plugin',
    renderTo: "grid-container"
  });
  
});

