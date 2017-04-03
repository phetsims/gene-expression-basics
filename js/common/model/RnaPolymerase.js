// Copyright 2015, University of Colorado Boulder

/**
 * Class that represents RNA polymerase in the model.
 *
 * @author John Blanco
 * @author Mohamed Safi
 */

define( function( require ) {
  'use strict';

  // modules
  var BioShapeUtils = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/BioShapeUtils' );
  var Color = require( 'SCENERY/util/Color' );
  var geneExpressionEssentials = require( 'GENE_EXPRESSION_ESSENTIALS/geneExpressionEssentials' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var MobileBiomolecule = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/MobileBiomolecule' );
  var RnaPolymeraseAttachmentStateMachine = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/attachment-state-machines/RnaPolymeraseAttachmentStateMachine' );
  var ShapeUtils = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/ShapeUtils' );
  var StubGeneExpressionModel = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/StubGeneExpressionModel' );
  var Vector2 = require( 'DOT/Vector2' );

  // constants

  // Overall size of the polymerase molecule.
  var WIDTH = 340;   // picometers
  var HEIGHT = 480;  // picometers

  // Offset from the center of the molecule to the location where mRNA should emerge when transcription is occurring.
  // This is determined empirically, and may need to change if the shape is changed.
  var MESSENGER_RNA_GENERATION_OFFSET = new Vector2( -WIDTH * 0.4, HEIGHT * 0.4 );

  // Set of points that outline the basic, non-distorted shape of this molecule. The shape is meant to look like
  // illustrations in "The Machinery of Life" by David Goodsell.
  var shapePoints = [ new Vector2( 0, HEIGHT / 2 ), // Middle top.
    new Vector2( WIDTH / 2, HEIGHT * 0.25 ),
    new Vector2( WIDTH * 0.35, -HEIGHT * 0.25 ),
    new Vector2( 0, -HEIGHT / 2 ), // Middle bottom.
    new Vector2( -WIDTH * 0.35, -HEIGHT * 0.25 ),
    new Vector2( -WIDTH / 2, HEIGHT * 0.25 )
  ];

  // Colors used by this molecule.
  var NOMINAL_COLOR = new Color( 0, 153, 210 );
  var CONFORMED_COLOR = Color.CYAN;

  // Direction vectors when polymerase detaches from DNA
  var UP_VECTOR = new Vector2( 0, 1 );
  var DOWN_VECTOR = new Vector2( 0, -1 );

  /**
   *
   * @param {GeneExpressionModel} model
   * @param {Vector2} position
   * @constructor
   */
  function RnaPolymerase( model, position ) {
    model = model || new StubGeneExpressionModel();
    MobileBiomolecule.call( this, model, this.createShape(), NOMINAL_COLOR );
    position = position || new Vector2( 0, 0 );
    this.messengerRnaGenerationOffset = MESSENGER_RNA_GENERATION_OFFSET;
    // Copy of the attachment state machine reference from base class, but with the more specific type.
    this.rnaPolymeraseAttachmentStateMachine = this.attachmentStateMachine; // defined by Super class - Ashraf
    this.setPosition( position );
  }

  geneExpressionEssentials.register( 'RnaPolymerase', RnaPolymerase );

  return inherit( MobileBiomolecule, RnaPolymerase, {

    /**
     * Overridden to provide attachment behavior that is unique to polymerase.
     *
     * @returns {RnaPolymeraseAttachmentStateMachine}
     */
    createAttachmentStateMachine: function() {
      return new RnaPolymeraseAttachmentStateMachine( this );
    },

    /**
     *
     * @param {number} changeFactor
     */
    changeConformation: function( changeFactor ) {
      // Seed value chosen by trial and error.
      var newUntranslatedShape = BioShapeUtils.createdDistortedRoundedShapeFromPoints( shapePoints, changeFactor, 45 );
      var translation = Matrix3.translation( this.getPosition().x, this.getPosition().y );
      var newTranslatedShape = newUntranslatedShape.transformed( translation );
      this.shapeProperty.set( newTranslatedShape );
      this.bounds = this.shapeProperty.get().bounds.copy();
      this.setCenter();
      this.colorProperty.set( Color.interpolateRGBA( NOMINAL_COLOR, CONFORMED_COLOR, changeFactor ) );
    },

    /**
     *
     * @returns {AttachmentSite}
     */
    proposeAttachments: function() {
      // Propose attachment to the DNA.
      return this.model.getDnaMolecule().considerProposalFromRnaPolymerase( this );
    },

    /**
     *
     * @returns {Vector2}
     */
    getDetachDirection: function() {
      // Randomly either up or down when detaching from DNA.
      return phet.joist.random.nextBoolean() ? UP_VECTOR : DOWN_VECTOR;
    },

    /**
     *
     * @param {boolean} recycleMode
     */
    setRecycleMode: function( recycleMode ) {
      this.rnaPolymeraseAttachmentStateMachine.setRecycleMode( recycleMode );
    },

    /**
     *
     * @param {Rectangle} recycleReturnZone
     */
    addRecycleReturnZone: function( recycleReturnZone ) {
      this.rnaPolymeraseAttachmentStateMachine.addRecycleReturnZone( recycleReturnZone );
    },

    /**
     *
     * @returns {Shape}
     */
    createShape: function() {
      // Shape is meant to look like illustrations in "The Machinery of  Life" by David Goodsell.
      return ShapeUtils.createRoundedShapeFromPoints( shapePoints );
    }
  } );
} );

