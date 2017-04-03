// Copyright 2015, University of Colorado Boulder

/**
 * A Node that represents a labeled box where the user can collect protein molecules.
 *
 * @author Sharfudeen Ashraf
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  // modules
  var Color = require( 'SCENERY/util/Color' );
  var geneExpressionEssentials = require( 'GENE_EXPRESSION_ESSENTIALS/geneExpressionEssentials' );
  var HBox = require( 'SCENERY/nodes/HBox' );
  var inherit = require( 'PHET_CORE/inherit' );
  var MultiLineText = require( 'SCENERY_PHET/MultiLineText' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Panel = require( 'SUN/Panel' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var ProteinCollectionArea = require( 'GENE_EXPRESSION_ESSENTIALS/manual-gene-expression/view/ProteinCollectionArea' );
  var Text = require( 'SCENERY/nodes/Text' );
  var VBox = require( 'SCENERY/nodes/VBox' );

  // constants
  var NUM_PROTEIN_TYPES = 3;  // Total number of protein types that can be collected.

  // Attributes of various aspects of the box.
  var TITLE_FONT = new PhetFont( { size: 18, weight: 'bold' } );
  var READOUT_FONT = new PhetFont( { size: 18, weight: 'bold' } );
  var BACKGROUND_COLOR = new Color( 255, 250, 205 );
  var INTEGER_BOX_BACKGROUND_COLOR = new Color( 240, 240, 240 );

  // strings
  var yourProteinCollectionString = require( 'string!GENE_EXPRESSION_ESSENTIALS/yourProteinCollection' );
  var collectionCompleteString = require( 'string!GENE_EXPRESSION_ESSENTIALS/collectionComplete' );
  var proteinCountCaptionPart1String = require( 'string!GENE_EXPRESSION_ESSENTIALS/proteinCountCaptionPart1' );
  var proteinCountCaptionPart2String = require( 'string!GENE_EXPRESSION_ESSENTIALS/proteinCountCaptionPart2' );

  /**
   * // private
   * Node that indicates the number of proteins that the user has collected so far. This monitors the model and updates
   * automatically.
   * @param {ManualGeneExpressionModel}model
   * @constructor
   */
  function CollectionCountIndicator( model ) {
    var contentNode = new Node();

    var collectionCompleteNode = new Text( collectionCompleteString, {
      font: new PhetFont( 20 ),
      maxWidth: 200
    } );
    contentNode.addChild( collectionCompleteNode );

    var countReadoutText = new Text( 0, {
      font: READOUT_FONT
    } );
    var countReadoutPanel = new Panel( countReadoutText, {
      minWidth: countReadoutText.width,
      resize: false,
      cornerRadius: 3,
      lineWidth: 1,
      align: 'center',
      fill: INTEGER_BOX_BACKGROUND_COLOR
    } );
    var countIndicatorNode = new HBox( {
      children: [ new Text( proteinCountCaptionPart1String, {
        font: READOUT_FONT,
        maxWidth: 100
      } ),
        countReadoutPanel ],
      spacing: 4
    } );

    var children = [ countIndicatorNode, new Text( proteinCountCaptionPart2String, {
      font: READOUT_FONT,
      maxWidth: 200
    } ) ];
    var collectedQuantityIndicator = new VBox( {
      children: children, spacing: 10
    } );

    contentNode.addChild( collectedQuantityIndicator );
    collectedQuantityIndicator.center = collectionCompleteNode.center;

    function countChangeUpdater() {
      var numProteinTypesCollected = 0;
      if ( model.proteinACollectedProperty.get() > 0 ) {
        numProteinTypesCollected++;
      }
      if ( model.proteinBCollectedProperty.get() > 0 ) {
        numProteinTypesCollected++;
      }
      if ( model.proteinCCollectedProperty.get() > 0 ) {
        numProteinTypesCollected++;
      }
      countReadoutText.setText( numProteinTypesCollected );
      // Set the visibility.
      collectedQuantityIndicator.setVisible( numProteinTypesCollected !== NUM_PROTEIN_TYPES );
      collectionCompleteNode.setVisible( numProteinTypesCollected === NUM_PROTEIN_TYPES );
    }

    model.proteinACollectedProperty.link( countChangeUpdater );
    model.proteinBCollectedProperty.link( countChangeUpdater );
    model.proteinCCollectedProperty.link( countChangeUpdater );

    return contentNode;

  }

  /**
   *
   * @param {ManualGeneExpressionModel} model
   * @param {ModelViewTransform2} mvt
   * @constructor
   */
  function ProteinCollectionNode( model, mvt ) {
    var self = this;
    Node.call( self );

    // Create the title and scale it if needed.
    var title = new MultiLineText( yourProteinCollectionString, {
        fill: Color.BLACK,
        font: TITLE_FONT,
        maxWidth: 120
      }
    );

    // Create the collection area.
    var collectionArea = new ProteinCollectionArea( model, mvt );

    var contents = new VBox( {
      children: [ title,
        collectionArea,
        CollectionCountIndicator( model ) ], spacing: 5
    } );

    self.addChild( new Panel( contents, {
      fill: BACKGROUND_COLOR,
      resize: false
    } ) );
  }

  geneExpressionEssentials.register( 'ProteinCollectionNode', ProteinCollectionNode );

  return inherit( Node, ProteinCollectionNode );

} );