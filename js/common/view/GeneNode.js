// Copyright 2015, University of Colorado Boulder

/**
 * Type that represents a gene in the view. Since a gene is basically a sequential collection of base pairs, this node
 * is basically something that highlights and labels the appropriate areas on the DNA strand.
 *
 * @author Sharfudeen Ashraf
 * @author John Blanco
 * @author Aadish Gupta
 */
define( function( require ) {
  'use strict';

  // modules
  var Color = require( 'SCENERY/util/Color' );
  var GEEConstants = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/GEEConstants' );
  var geneExpressionEssentials = require( 'GENE_EXPRESSION_ESSENTIALS/geneExpressionEssentials' );
  var inherit = require( 'PHET_CORE/inherit' );
  var MultiLineText = require( 'SCENERY_PHET/MultiLineText' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Path = require( 'SCENERY/nodes/Path' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Shape = require( 'KITE/Shape' );
  var Text = require( 'SCENERY/nodes/Text' );

  // strings
  var regulatoryRegionString = require( 'string!GENE_EXPRESSION_ESSENTIALS/regulatoryRegion' );
  var transcribedRegionString = require( 'string!GENE_EXPRESSION_ESSENTIALS/transcribedRegion' );

  // constants
  var REGION_LABEL_FONT = new PhetFont( { size: 12, weight: 'bold' } );
  var GENE_LABEL_FONT = new PhetFont( { size: 18, weight: 'bold' } );
  var BRACKET_DEPTH = 30;
  var RECT_ROUNDING = 15;

  /**
   * @param {ModelViewTransform2} mvt
   * @param {Gene} gene
   * @param {DnaMolecule} dnaMolecule
   * @param {string} label
   * @param {boolean} showBracketLabel
   * @constructor
   */
  function GeneNode( mvt, gene, dnaMolecule, label, showBracketLabel ) {
    Node.call( this );

    var highlightHeight = -mvt.modelToViewDeltaY( GEEConstants.DNA_MOLECULE_DIAMETER * 1.5 );
    var highlightStartY = mvt.modelToViewY( dnaMolecule.getLeftEdgePos().y ) - highlightHeight / 2;

    // Add the highlight for the regulatory region.
    var regRegionHighlightStartX = mvt.modelToViewX( dnaMolecule.getBasePairXOffsetByIndex( gene.getRegulatoryRegion().min ) );
    var regRegionWidth = mvt.modelToViewX( dnaMolecule.getBasePairXOffsetByIndex( gene.getRegulatoryRegion().max ) ) - regRegionHighlightStartX;
    var regRegionShape = Shape.roundRect( regRegionHighlightStartX, highlightStartY, regRegionWidth, highlightHeight,
      RECT_ROUNDING, RECT_ROUNDING );
    var regulatoryRegionNode = new Path( regRegionShape, { fill: gene.getRegulatoryRegionColor() } );
    this.addChild( regulatoryRegionNode );

    var regulatoryRegionCaption = new MultiLineText( regulatoryRegionString, {
      font: REGION_LABEL_FONT,
      maxWidth: 100
    } );
    regulatoryRegionCaption.x = regulatoryRegionNode.bounds.getCenterX() - regulatoryRegionCaption.bounds.width / 2;
    regulatoryRegionCaption.y = regulatoryRegionNode.bounds.getMaxY();
    this.addChild( regulatoryRegionCaption );

    // Add the highlight for the transcribed region.
    var transcribedRegionHighlightStartX = mvt.modelToViewX( dnaMolecule.getBasePairXOffsetByIndex( gene.getTranscribedRegion().min ) );
    var transcribedRegionWidth = mvt.modelToViewX( dnaMolecule.getBasePairXOffsetByIndex( gene.getTranscribedRegion().max ) ) - transcribedRegionHighlightStartX;
    var transcribedRegionShape = Shape.roundRect( transcribedRegionHighlightStartX, highlightStartY,
      transcribedRegionWidth, highlightHeight, RECT_ROUNDING, RECT_ROUNDING );

    var transcribedRegionNode = new Path( transcribedRegionShape, { fill: gene.getTranscribedRegionColor() } );
    this.addChild( transcribedRegionNode );

    var transcribedRegionCaption = new MultiLineText( transcribedRegionString, {
      font: REGION_LABEL_FONT,
      maxWidth: 100
    } );
    transcribedRegionCaption.x = transcribedRegionNode.bounds.getCenterX() - transcribedRegionCaption.bounds.width / 2;
    transcribedRegionCaption.y = transcribedRegionNode.bounds.getMaxY();
    this.addChild( transcribedRegionCaption );

    // Add the bracket.  This is a portion (the non-textual part) of the  label for the gene.
    if ( showBracketLabel ) {
      var bracketPath = new Shape();
      bracketPath.moveTo( regulatoryRegionNode.bounds.getMinX(),
        regulatoryRegionCaption.bounds.getMaxY() );
      bracketPath.lineToRelative( BRACKET_DEPTH, BRACKET_DEPTH );
      bracketPath.lineTo( transcribedRegionNode.bounds.getMaxX() - BRACKET_DEPTH,
        transcribedRegionCaption.bounds.getMaxY() + BRACKET_DEPTH );
      bracketPath.lineToRelative( BRACKET_DEPTH, -BRACKET_DEPTH );
      this.addChild( new Path( bracketPath, { lineWidth: 2, stroke: Color.BLACK } ) );

      // And the textual label for the gene.
      var labelText = new Text( label, {
        font: GENE_LABEL_FONT,
        maxWidth: 150
      } );
      this.addChild( labelText );
      var bracketBounds = bracketPath.bounds;
      labelText.x = bracketBounds.getCenterX() - labelText.bounds.width / 2;
      labelText.y = bracketBounds.getMaxY() + 20;
    }
  }

  geneExpressionEssentials.register( 'GeneNode', GeneNode );

  return inherit( Node, GeneNode );
} );
