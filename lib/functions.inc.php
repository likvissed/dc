<?php

//Многобайтовая замена строк
function mb_substr_replace($output, $replace, $posOpen, $posClose)
{
  return mb_substr($output, 0, $posOpen) . $replace . mb_substr($output, $posClose + 1);
}
