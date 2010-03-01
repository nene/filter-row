<?php

$data = array(
  array('3m Co', 71.72, 'up'),
  array('Alcoa Inc', 29.01, 'down'),
  array('Altria Group Inc', 83.81, 'up'),
  array('American Express Company', 52.55, 'up'),
  array('American International Group, Inc.', 64.13, 'none'),
  array('AT&T Inc.', 31.61, 'up'),
  array('Boeing Co.', 75.43, 'up'),
  array('Caterpillar Inc.', 67.27, 'up'),
  array('Citigroup, Inc.', 49.37, 'down'),
  array('E.I. du Pont de Nemours and Company', 40.48, 'down'),
  array('Exxon Mobil Corp', 68.1, 'up'),
  array('General Electric Company', 34.14, 'up'),
  array('General Motors Corporation', 30.27, 'up'),
  array('Hewlett-Packard Co.', 36.53, 'none'),
  array('Honeywell Intl Inc', 38.77, 'down'),
  array('Intel Corporation', 19.88, 'down'),
  array('International Business Machines', 81.41, 'none'),
  array('Johnson & Johnson', 64.72, 'none'),
  array('JP Morgan & Chase & Co', 45.73, 'down'),
  array('McDonald\'s Corporation', 36.76, 'up'),
  array('Merck & Co.,  Inc.', 40.96, 'none'),
  array('Microsoft Corporation', 25.84, 'down'),
  array('Pfizer Inc', 27.96, 'down'),
  array('The Coca-Cola Company', 45.07, 'up'),
  array('The Home Depot,  Inc.', 34.64, 'down'),
  array('The Procter & Gamble Company', 61.91, 'up'),
  array('United Technologies Corporation', 63.26, 'none'),
  array('Verizon Communications', 35.57, 'up'),
  array('Wal-Mart Stores, Inc.', 45.45, 'down'),
);

$json = array();
$i = 0;
foreach ($data as $d) {
  list($company, $price, $change) = $d;

  // when params sent, do filtering
  if (isset($_REQUEST["company"])) {
    if (!preg_match("/^$_REQUEST[company]/i", $company)) {
      continue;
    }
    if (!preg_match("/^$_REQUEST[price]/i", $price)) {
      continue;
    }
    if (!preg_match("/^$_REQUEST[change]/i", $change)) {
      continue;
    }
    // when filtering, show only first ten results
    $i++;
    if ($i > 10) {
      break;
    }
  }
  
  $json[]= array(
    "company" => $company,
    "price" => $price,
    "change" => $change,
  );
}

echo json_encode(array("rows" => $json));

?>