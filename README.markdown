Ext.ux.grid.FilterRow
=====================

Plugin for Ext.grid.GridPanel that places form fields right below grid
headers, where they can be used for filtering grid contents or
(haven't really tried that) inserting new data.

Licensed under [GNU General Public License v3][gpl3].

How it works
------------

Let's create a grid that displays list of persons and allows filtering
by first- and last name.  For that we define a GridPanel as always,
but inside column definitions, we add a special "filter" property,
that is detected by FilterRow plugin:

    columns: [
      {
        id: "fname",
        dataIndex: "fname"
        header: "First name",
        filter: {
          field: new Ext.form.TextField({enableKeyEvents: true}),
          events: ["keyup"]
        }
      },
      {
        id: "lname",
        dataIndex: "lname"
        header: "Last name",
        filter: {
          field: new Ext.form.TextField({enableKeyEvents: true}),
          events: ["keyup"]
        }
      },
      ...
    ]

Here we define both filters to be TextFields and tell FilterRow to
listen "keyup" events from them - this will give us nice
filter-as-you-type functionality.  Also note that we define the "id"
property for each column with filter.  This is needed to identify the
column in "change" event listener, which will be called with an object
that maps column id-s to their current values:

    var filterRow = new Ext.ux.grid.FilterRow();
    filterRow.on("change", function(filterValues) {
      var reFName = new RegExp("^"+filterValues.fname);
      var reLName = new RegExp("^"+filterValues.lname);
      store.filterBy(function(r) {
        return reFName.test(r.get("fname")) &&
               reLName.test(r.get("lname"));
      });
    });

The "change" event handler is crucial - without implementing that the
FilterRow won't do anything.

The final thing to do, is add the FilterRow plugin to the grid like
any other plugin:

    plugins: [filterRow],

A picture speaks a thousand words
----------------------------------

* [Live example][live]

This is not one man's work
--------------------------

* Based on [durlabh's code from ExtJS forum][post].
* Thanks to [Saneth][saneth] for patch on better look.

Changelog
---------

* 0.2 version
  * Filter editors are defined inside grid columns. No more global ID-s.
  * For each editor an event name can be configured. So you can
    configure TextField to trigger the FilterRow "change" event on
    each keypress, while for ComboBox just listen the "change" event.
  * The "change" event now only contains the data object with values
    of each field. No more {filter: ..., data: ...}, just the data
    part of that.
  * Finally added some documentation.
  * Look-and-feel improvement by [Saneth][saneth].

* 0.1 version
  * Initial version by [durlabh][post] (I'll call it 0.1).

[gpl3]: http://www.gnu.org/licenses/gpl.html
[post]: http://www.extjs.net/forum/showthread.php?t=55730
[saneth]: http://www.extjs.net/forum/showthread.php?p=438457#post438457
[live]: http://triin.net/temp/filter-row/

