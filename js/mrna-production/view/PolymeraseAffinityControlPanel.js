// Copyright 2015, University of Colorado Boulder

/**
 * Control panel that present a user interface for controlling the affinity of RNA polymerase to DNA plus a transcription factor.
 *
 * @author Mohamed Safi
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  // modules
  var geneExpressionEssentials = require( 'GENE_EXPRESSION_ESSENTIALS/geneExpressionEssentials' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Text = require( 'SCENERY/nodes/Text' );
  var Panel = require( 'SUN/Panel' );
  var VBox = require( 'SCENERY/nodes/VBox' );
  var Color = require( 'SCENERY/util/Color' );
  var Vector2 = require( 'DOT/Vector2' );
  var ModelViewTransform2 = require( 'PHETCOMMON/view/ModelViewTransform2' );
  var TranscriptionFactor = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/TranscriptionFactor' );
  var DnaMoleculeNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/DnaMoleculeNode' );
  var DnaMolecule = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/DnaMolecule' );
  var AffinityController = require( 'GENE_EXPRESSION_ESSENTIALS/mrna-production/view/AffinityController' );
  var RnaPolymerase = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/RnaPolymerase' );
  var CommonConstants = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/CommonConstants' );
  var MobileBiomoleculeNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/MobileBiomoleculeNode' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Property = require( 'AXON/Property' );
  var Spacer = require( 'SCENERY/nodes/Spacer' );

  // constants
  var TITLE_FONT = new PhetFont( { size: 16, weight: 'bold' } );
  var POLYMERASE_SCALE = 0.08;
  var POLYMERASE_MVT = ModelViewTransform2.createSinglePointScaleInvertedYMapping( new Vector2( 0, 0 ),
    new Vector2( 0, 0 ), POLYMERASE_SCALE );
  var DNA_AND_TF_SCALE = 0.08;
  var DNA_AND_TF_MVT = ModelViewTransform2.createSinglePointScaleInvertedYMapping( new Vector2( 0, 0 ),
    new Vector2( 0, 0 ), DNA_AND_TF_SCALE );

  //strings
  var rnaPolymeraseString = require( 'string!GENE_EXPRESSION_ESSENTIALS/rnaPolymerase' );

  /**
   *
   * @param {TranscriptionFactorConfig} tfConfig
   * @param {number} minHeight
   * @param {Property} affinityProperty
   * @constructor
   */
  function PolymeraseAffinityControlPanel( tfConfig, minHeight, polymeraseAffinityProperty ) {
    var self = this;


    var titleNode = new Text( rnaPolymeraseString,{
      font: TITLE_FONT,
      maxWidth: 180
    } );


    // Create the affinity control node.
    // REVIEW: why do we need to pass a MVT into biomolecule nodes in general? I've found it simpler to apply the transformation to the PNode
    // itself, and then place mouse-interaction code at a location like this in a double-brace block if it needs to know the transform information.
    // This way, not every node has to be passed a transform. Are there specific exceptions in this case that prevent that from being useful?
    var polymeraseNode = new MobileBiomoleculeNode( POLYMERASE_MVT, new RnaPolymerase() );
    var dnaFragmentNode = new DnaMoleculeNode( new DnaMolecule( null, CommonConstants.BASE_PAIRS_PER_TWIST * 2 + 1, 0.0, true ), DNA_AND_TF_MVT, 2, false );
    var transcriptionFactorNode = new MobileBiomoleculeNode( DNA_AND_TF_MVT, new TranscriptionFactor( null, tfConfig ) );
    transcriptionFactorNode.x = 25;
    transcriptionFactorNode.y = 0; // Set position to be on top of the dna, values empirically determined.
    dnaFragmentNode.addChild( transcriptionFactorNode );

    var panelOptions = {
      fill: new Color( 250, 250, 250 ),
      lineWidth: 2,
      xMargin: 10,
      yMargin: 10,
      minWidth: 200,
      align: 'center',
      resize: false
    };

    // In order to size the control panel correctly, make one first, see how far off it is, and then make one of the
    // correct size.
    var dummyContents = new VBox( {
        children: [ titleNode,
         new AffinityController( polymeraseNode, dnaFragmentNode, new Property( 0 ) ),
        ],
        spacing: 20
      }
    );
    var dummyControlPanel =  new Panel( dummyContents, panelOptions );
    var  growthAmount = minHeight - dummyControlPanel.height - 40;

    // Create the spacers used to make the panel meet the min size.
    var topSpacer = new Spacer( 0, growthAmount * 0.25 );
    var bottomSpacer = new Spacer( 0, growthAmount * 0.75 );

    var contents = new VBox( {
        children: [ titleNode, topSpacer,
          new AffinityController( polymeraseNode, dnaFragmentNode, polymeraseAffinityProperty ),
          bottomSpacer
        ],
        spacing: 20
      }
    );

    Panel.call( self, contents, panelOptions );

  }

  geneExpressionEssentials.register( 'PolymeraseAffinityControlPanel', PolymeraseAffinityControlPanel );

  return inherit( Panel, PolymeraseAffinityControlPanel );

} );