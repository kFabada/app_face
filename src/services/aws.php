<?php
require './vendor/autoload.php';

use Aws\Rekognition\RekognitionClient;
use Aws\Exception\AwsException;

$rekognition = new RekognitionClient([
    'region'    => 'us-west-2',
    'version'   => 'latest'
]);

$image = fopen('/path/to/image.jpg', 'r');
$bytes = fread($image, filesize('/path/to/image.jpg'));
fclose($image);

try {
    $result = $rekognition->detectFaces([
        'Image' => [
            'Bytes' => $bytes,
        ],
        'Attributes' => ['ALL'] // Inclui landmarks e outras informações
    ]);

    foreach ($result['FaceDetails'] as $face) {
        echo "Landmarks:\n";
        foreach ($face['Landmarks'] as $landmark) {
            echo $landmark['Type'] . ": (" . $landmark['X'] . ", " . $landmark['Y'] . ")\n";
        }
    }
} catch (AwsException $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
