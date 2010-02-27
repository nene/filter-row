Ext.ux.grid.FilterRow
=====================

Plugin for Ext.grid.GridPanel that places form fields right below grid
headers, where they can be used for filtering grid contents.

Licensed under [GNU General Public License v3][gpl3].

How it works
------------

Let's create a grid that displays list of persons and allows filtering
by first- and last name.  For that we define a GridPanel as always,
but inside column definitions, we add a special "filter" property,
that is detected by FilterRow plugin:

    var grid = new Ext.grid.GridPanel({
      store: someStore,
      columns: [
        {
          dataIndex: "fname"
          header: "First name",
          filter: {}
        },
        {
          dataIndex: "lname"
          header: "Last name",
          filter: {}
        }
      ],
      plugins: ["filterrow"]
    });

That's it!  Our grid now has a row of editors below its headers and
the grid is filtered right as you type.

This is the default behaviour, that's because the filter config is
completely empty.  But we can fill it out to match the particular
needs of our application.

### Regex filters

The most useful of the config options is **test:** - it defines the
logic for filtering the column.  It's default value is `"/^{0}/i"` -
this looks like a regular expression and it almost is.  It's a
template for the regular expression that will be used to filter the
grid.  `{0}` is a placeholder for the value read from the field of our
filter.  For example when user types in `"Mary"` this template will
create a regular expression `/^Mary/i`.

If you know regular expressions, it should be pretty obvious now.  But
for start, here's a filter that is a) case sensitive, and b) matches
the end instead of beginning:

    filter: {
      test: "/{0}$/"
    }

### Filtering functions

But regexes aren't the only option here.  For complete control you can
declare a function to decide which rows to include and which not:

    filter: {
      test: function(filterValue, rowValue) {
        return filterValue <= rowValue;
      }
    }

The above example excludes all rows having smaller value than the one
entered to filter field.

### Different field types

So far we have been using TextFields for filtering, but we can easily
use others.  This is done through the **field:** config option:

    filter: {
      field: {
        xtype: "combo",
        ... all kind of combo box config ...
      },
      events: ["select"],
    }

Not that in addition to `field:` we also define `events:` - these are
the events of field which trigger the filtering of grid.  By default
the events array contains only "keyup" event which works well for
TextFields, but for other types you might need to specify your own.

This should be enough for introduction.  Read the source for full
documentation of different config options.


A picture speaks a thousand words
---------------------------------

* [Live example][live]

This is not one man's work
--------------------------

* Based on [durlabh's code from ExtJS forum][post].
* Thanks to [Saneth][saneth] for patch on better look.

Changelog
---------

* Development version
  * Greatly simplified the creation of filters.  The logic for each
    filter is now defined separately and combined automatically.
    Actually, often the logic doesn't even need to be defined, just
    using the defaults might be enough.
  * Plugin registered with Ext.ComponentMgr as "filterrow".
  * Each filter is now an instance of FilterRowFilter class.
  * Filter fields can be specified with config objects.
  * Column id-s no more required.
  * Removed "change" event from FilterRow.
  * Use of FilterRow for anything else than filtering no more supported.

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

