//  Copyright 2002-2014, University of Colorado Boulder
/**
 * Class that represents messenger ribonucleic acid, or mRNA, in the model.
 * This class is fairly complex, due to the need for mRNA to wind up and
 * unwind as it is transcribed, translated, and destroyed.
 *
 * @author John Blanco
 * @author Mohamed Safi
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Map = require( 'GENE_EXPRESSION_BASICS/common/util/Map' );
  var Vector2 = require( 'DOT/Vector2' );
  var Property = require( 'AXON/Property' );
  var MessengerRnaAttachmentStateMachine = require( 'GENE_EXPRESSION_BASICS/common/model/attachmentstatemachines/MessengerRnaAttachmentStateMachine' );
  var WindingBiomolecule = require( 'GENE_EXPRESSION_BASICS/common/model/WindingBiomolecule' );
  var Shape = require( 'KITE/Shape' );
  var PlacementHint = require( 'GENE_EXPRESSION_BASICS/common/model/PlacementHint' );
  var Ribosome = require( 'GENE_EXPRESSION_BASICS/common/model/Ribosome' );
  var MessengerRnaDestroyer = require( 'GENE_EXPRESSION_BASICS/common/model/MessengerRnaDestroyer' );

  // constants
  // Distance within which this will connect to a ribosome.
  var RIBOSOME_CONNECTION_DISTANCE = 400; // picometers
  var MRNA_DESTROYER_CONNECT_DISTANCE = 400; // picometers


  /**
   * Constructor.  This creates the mRNA as a single point, with the intention of growing it.
   *
   * @param {GeneExpressionModel} model
   * @param {Protein} proteinPrototype
   * @param {Vector2} position
   * @constructor
   */
  function MessengerRna( model, proteinPrototype, position ) {
    var self = this;
    WindingBiomolecule.call( self, model, new Shape().moveToPoint( position ), position );

    // Protein prototype, used to keep track of protein that should be
    // synthesized from this particular strand of mRNA.
    self.proteinPrototype = proteinPrototype;

    // Local reference to the non-generic state machine used by this molecule.
    self.mRnaAttachmentStateMachine = self.attachmentStateMachine; // private

    // Externally visible indicator for whether this mRNA is being synthesized.
    // Assumes that it is being synthesized when created.
    self.beingSynthesized = new Property( true );

    // Map from ribosomes to the shape segment to which they are attached.
    self.mapRibosomeToShapeSegment = new Map();

    // mRNA destroyer that is destroying this mRNA.  Null until and unless
    // destruction has begun.
    self.messengerRnaDestroyer = null;

    // Shape segment where the mRNA destroyer is connected.  This is null until
    // and unless destruction has begun.
    self.segmentWhereDestroyerConnects = null;


    // Add the first segment to the shape segment list.  This segment will
    // contain the "leader" for the mRNA. //TODO
    //this.shapeSegments.add( new ShapeSegment.FlatSegment( position ) {{
    //    setCapacity( LEADER_LENGTH );
    //}} );

    // Add the placement hints for the locations where the user can attach
    // a ribosome or an mRNA destroyer.
    self.ribosomePlacementHint = new PlacementHint( new Ribosome( model ) );
    self.mRnaDestroyerPlacementHint = new PlacementHint( new MessengerRnaDestroyer( model ) );

    //TODO
    //this.shapeProperty.addObserver( new SimpleObserver() {
    //    public void update() {
    //        // This hint always sits at the beginning of the RNA strand.
    //        var currentMRnaFirstPointPosition = new Vector2( self.firstShapeDefiningPoint.getPosition() );
    //      self.ribosomePlacementHint.setPosition( currentMRnaFirstPointPosition.minus( Ribosome.OFFSET_TO_TRANSLATION_CHANNEL_ENTRANCE ) );
    //    self.mRnaDestroyerPlacementHint.setPosition( currentMRnaFirstPointPosition );
    //    }
    //} );

  }

  return inherit( WindingBiomolecule, MessengerRna, {


    /**
     * @Override
     * @param translationVector
     */
    translate: function( translationVector ) {

      // Translate the current shape user the superclass facility.
      WindingBiomolecule.prototype.translate.call( this, translationVector );

      // Translate each of the shape segments that define the outline shape.
      _.forEach( this.shapeSegments, function( shapeSegment ) {
        shapeSegment.translate( translationVector );
      } );

      // Translate each of the points that define the curly mRNA shape.
      var thisPoint = this.firstShapeDefiningPoint;
      while ( thisPoint !== null ) {
        thisPoint.translate( translationVector );
        thisPoint = thisPoint.getNextPointMass();
      }
    },

    /**
     * Command this mRNA strand to fade away when it has become fully formed.
     * This was created for use in the 2nd tab, where mRNA is never translated
     * once it is produced.
     *
     * @param {boolean} fadeAwayWhenFormed
     */
    setFadeAwayWhenFormed: function( fadeAwayWhenFormed ) {
      // Just pass this through to the state machine.
      this.mRnaAttachmentStateMachine.setFadeAwayWhenFormed( fadeAwayWhenFormed );
    },

    /**
     * Advance the translation of the mRNA through the given ribosome by the
     * specified length.  The given ribosome must already be attached to the
     * mRNA.
     *
     * @param {Ribosome} ribosome - The ribosome by which the mRNA is being translated.
     * @param {number} length   - The amount of mRNA to move through the translation channel.
     * @return - true if the mRNA is completely through the channel, indicating,
     *         that transcription is complete, and false if not.
     */
    advanceTranslation: function( ribosome, length ) {

      var segmentToAdvance = this.mapRibosomeToShapeSegment.get( ribosome );

      // Advance the translation by advancing the position of the mRNA in the
      // segment that corresponds to the translation channel of the ribosome.
      segmentToAdvance.advance( length, this.shapeSegments );

      // Realign the segments, since they may well have changed shape.
      if ( this.shapeSegments.contains( segmentToAdvance ) ) {
        this.realignSegmentsFrom( segmentToAdvance );
      }

      // Since the sizes and relationships of the segments probably changed,
      // the winding algorithm needs to be rerun.
      this.windPointsThroughSegments();

      // If there is anything left in this segment, then transcription is not
      // yet complete.
      return segmentToAdvance.getContainedLength() <= 0;
    },

    /**
     * Advance the destruction of the mRNA by the specified length.  This pulls
     * the strand into the lead segment much like translation does, but does
     * not move the points into new segment, it just gets rid of them.
     *
     * @param {number} length
     * @return {boolean}
     */
    advanceDestruction: function( length ) {

      // Error checking.
      if ( this.segmentWhereDestroyerConnects === null ) {
        console.log( " - Warning: Attempt to advance the destruction of mRNA that has no content left." );
        return true;
      }

      // Advance the destruction by reducing the length of the mRNA.
      this.reduceLength( length );

      // Realign the segments, since they may well have changed shape.
      if ( this.shapeSegments.contains( this.segmentWhereDestroyerConnects ) ) {
        this.realignSegmentsFrom( this.segmentWhereDestroyerConnects );
      }

      if ( this.shapeSegments.length > 0 ) {

        // Since the sizes and relationships of the segments probably changed,
        // the winding algorithm needs to be rerun.
        this.windPointsThroughSegments();
      }

      // If there is any length left, then the destruction is not yet
      // complete.  This is a quick way to test this.
      return this.firstShapeDefiningPoint === this.lastShapeDefiningPoint;
    },


    /**
     * Reduce the length of the mRNA.  This handles both the shape segments and
     * the shape-defining points.
     * @private
     * @param {number} reductionAmount
     */
    reduceLength: function( reductionAmount ) {
      if ( reductionAmount >= this.getLength() ) {

        // Reduce length to be zero.
        this.lastShapeDefiningPoint = this.firstShapeDefiningPoint;
        this.lastShapeDefiningPoint.setNextPointMass( null );
        this.shapeSegments.clear();//TODO
      }
      else {

        // Remove the length from the shape segments.
        this.segmentWhereDestroyerConnects.advanceAndRemove( reductionAmount, this.shapeSegments );

        // Remove the length from the shape defining points.
        for ( var amountRemoved = 0; amountRemoved < reductionAmount; ) {
          if ( this.lastShapeDefiningPoint.getTargetDistanceToPreviousPoint() <= reductionAmount - amountRemoved ) {

            // Remove the last point from the list.
            amountRemoved += this.lastShapeDefiningPoint.getTargetDistanceToPreviousPoint();
            this.lastShapeDefiningPoint = this.lastShapeDefiningPoint.getPreviousPointMass();
            this.lastShapeDefiningPoint.setNextPointMass( null );
          }
          else {

            // Reduce the distance of the last point from the previous point.
            this.lastShapeDefiningPoint.setTargetDistanceToPreviousPoint( this.lastShapeDefiningPoint.getTargetDistanceToPreviousPoint() - ( reductionAmount - amountRemoved ) );
            amountRemoved = reductionAmount;
          }
        }
      }
    },

    /**
     * Create a new version of the protein that should result when this strand
     * of mRNA is translated.
     *
     * @return {Protein}
     */
    getProteinPrototype: function() {
      return this.proteinPrototype;
    },

    /**
     * Get the point in model space where the entrance of the given ribosome's
     * translation channel should be in order to be correctly attached to
     * this strand of messenger RNA.  This allows the ribosome to "follow" the
     * mRNA if it is moving or changing shape.
     *
     * @param {Ribosome} ribosome
     * @return {Vector2}
     */
    getRibosomeAttachmentLocation: function( ribosome ) {
      if ( !this.mapRibosomeToShapeSegment.contains( ribosome ) ) {
        console.log( " Warning: Ignoring attempt to obtain attachment point for non-attached ribosome." );
        return null;
      }
      var attachmentPoint;
      var segment = this.mapRibosomeToShapeSegment.get( ribosome );
      if ( this.shapeSegments.getPreviousItem( segment ) === null ) {

        // There is no previous segment, which means that the segment to
        // which this ribosome is attached is the leader segment.  The
        // attachment point is thus the leader length from its rightmost
        // edge.
        attachmentPoint = new Vector2( segment.getLowerRightCornerPos().x - MessengerRna.LEADER_LENGTH,
          segment.getLowerRightCornerPos().y );
      }
      else {

        // The segment has filled up the channel, so calculate the
        // position based on its left edge.
        attachmentPoint = new Vector2( segment.getUpperLeftCornerPos().x + ribosome.getTranslationChannelLength(),
          segment.getUpperLeftCornerPos().y );
      }
      return attachmentPoint;
    },

    /**
     * Release this mRNA from a ribosome.  If this is the only ribosome to
     * which the mRNA is connected, the mRNA will start wandering.
     *
     * @param {Ribosome} ribosome
     */
    releaseFromRibosome: function( ribosome ) {
      this.mapRibosomeToShapeSegment.remove( ribosome );
      if ( this.mapRibosomeToShapeSegment.isEmpty() ) {
        this.mRnaAttachmentStateMachine.allRibosomesDetached();
      }
    },

    /**
     * Release this mRNA from the polymerase which is, presumably, transcribing
     * it.
     */
    releaseFromPolymerase: function() {
      this.mRnaAttachmentStateMachine.detach();
    },

    /**
     * Activate the placement hint(s) as appropriate for the given biomolecule.
     *
     * @param {MobileBiomolecule} biomolecule - And instance of the type of biomolecule for which
     *                    any matching hints should be activated.
     */
    activateHints: function( biomolecule ) {
      this.ribosomePlacementHint.activateIfMatch( biomolecule );
      this.mRnaDestroyerPlacementHint.activateIfMatch( biomolecule );
    },

    deactivateAllHints: function() {
      this.ribosomePlacementHint.active.set( false );
      this.mRnaDestroyerPlacementHint.active.set( false );
    },

    /**
     * Initiate the translation process by setting up the segments as needed.
     * This should only be called after a ribosome that was moving to attach
     * with this mRNA arrives at the attachment point.
     *
     * @param {Ribosome} ribosome
     */
    initiateTranslation: function( ribosome ) {

      // Set the capacity of the first segment to the size of the channel
      // through which it will be pulled plus the leader length.
      var firstShapeSegment = this.shapeSegments[ 0 ]; //TODO
      firstShapeSegment.setCapacity( this.ribosome.getTranslationChannelLength() + MessengerRna.LEADER_LENGTH );
    },

    /**
     * Initiate the destruction of this mRNA strand by setting up the segments
     * as needed.  This should only be called after an mRNA destroyer has
     * attached to the front of the mRNA strand.  Once initiated, destruction
     * cannot be stopped.
     *
     * @param {MessengerRnaDestroyer} messengerRnaDestroyer
     */
    initiateDestruction: function( messengerRnaDestroyer ) {

      // Set the capacity of the first segment to the size of the channel
      // through which it will be pulled plus the leader length.
      this.segmentWhereDestroyerConnects = this.shapeSegments.get( 0 ); //TODO
      this.segmentWhereDestroyerConnects.setCapacity( this.messengerRnaDestroyer.getDestructionChannelLength() + MessengerRna.jsLEADER_LENGTH );
    },

    /**
     * Get the proportion of the entire mRNA that has been translated by the
     * given ribosome.
     *
     * @param {Ribosome} ribosome
     * @return
     */
    getProportionOfRnaTranslated: function( ribosome ) {

      var translatedLength = 0;

      var segmentInRibosomeChannel = this.mapRibosomeToShapeSegment.get( ribosome );

      // Add the length for each segment that precedes this ribosome.
      _.forEach( this.shapeSegments, function( shapeSegment ) {
        if ( shapeSegment === segmentInRibosomeChannel ) {
          return false;// break;
        }
        translatedLength += shapeSegment.getContainedLength();
      } );

      // Add the length for the segment that is inside the translation
      // channel of this ribosome.
      translatedLength += segmentInRibosomeChannel.getContainedLength() -
                          ( segmentInRibosomeChannel.getLowerRightCornerPos().x -
                            segmentInRibosomeChannel.attachmentSite.locationProperty.get().x);

      return Math.max( translatedLength / this.getLength(), 0 );
    },

    /**
     *
     * @param {Ribosome} ribosome
     * @returns {AttachmentSite}
     */
    considerProposalFromByRibosome: function( ribosome ) {

      var returnValue = null;

      // Can't consider proposal if currently being destroyed.
      if ( this.messengerRnaDestroyer === null ) {

        // See if the attachment site at the leading edge of the mRNA is
        // available.
        var leadingEdgeAttachmentSite = this.shapeSegments.get( 0 ).attachmentSite;
        if ( leadingEdgeAttachmentSite.attachedOrAttachingMolecule === null &&
             leadingEdgeAttachmentSite.locationProperty.get().distance(
               ribosome.getEntranceOfRnaChannelPos() ) < RIBOSOME_CONNECTION_DISTANCE ) {

          // This attachment site is in range and available.
          returnValue = leadingEdgeAttachmentSite;

          // Update the attachment state machine.
          this.mRnaAttachmentStateMachine.attachedToRibosome();

          // Enter this connection in the map.
          this.mapRibosomeToShapeSegment.put( ribosome, this.shapeSegments.get( 0 ) );
        }
      }

      return returnValue;
    },

    /**
     *
     * @param {MessengerRnaDestroyer} messengerRnaDestroyer
     * @returns {AttachmentSite}
     */
    considerProposalFromByMessengerRnaDestroyer: function( messengerRnaDestroyer ) {
      var returnValue = null;

      // Make sure that this mRNA is not already being destroyed.
      if ( this.messengerRnaDestroyer === null ) {

        // See if the attachment site at the leading edge of the mRNA is
        // available.
        var leadingEdgeAttachmentSite = this.shapeSegments.get( 0 ).attachmentSite;
        if ( leadingEdgeAttachmentSite.attachedOrAttachingMolecule === null &&
             leadingEdgeAttachmentSite.locationProperty.get().distance(
               messengerRnaDestroyer.getPosition() ) < MRNA_DESTROYER_CONNECT_DISTANCE ) {

          // This attachment site is in range and available.
          returnValue = leadingEdgeAttachmentSite;
          // Update the attachment state machine.
          this.mRnaAttachmentStateMachine.attachToDestroyer();
          // Keep track of the destroyer.
          this.messengerRnaDestroyer = messengerRnaDestroyer;
        }
      }

      return returnValue;
    },

    /*
     * Aborts the destruction process, used if the mRNA destroyer was on its
     * way to the mRNA but the user picked it up before it got there.
     */
    abortDestruction: function() {
      this.messengerRnaDestroyer = null;
      this.attachmentStateMachine.forceImmediateUnattachedAndAvailable();
    },

    /**
     * @Override
     * @returns {MessengerRnaAttachmentStateMachine}
     */
    createAttachmentStateMachine: function() {
      return new MessengerRnaAttachmentStateMachine( this );
    },

    /**
     *
     * @returns {Vector2}
     */
    getDestroyerAttachmentLocation: function() {

      // Avoid null pointer exception.
      if ( this.segmentWhereDestroyerConnects === null ) {
        return new Vector2( 0, 0 );
      }

      // The attachment location is at the right most side of the segment
      // minus the leader length.
      return new Vector2( this.segmentWhereDestroyerConnects.getLowerRightCornerPos().x - MessengerRna.LEADER_LENGTH,
        this.segmentWhereDestroyerConnects.getLowerRightCornerPos().y );
    }

  }, {

    // Length of the "leader segment", which is the portion of the mRNA that
    // sticks out on the upper left side so that a ribosome can be attached.
    LEADER_LENGTH: WindingBiomolecule.INTER_POINT_DISTANCE * 2

  } );
} );
//// Copyright 2002-2012, University of Colorado
//package edu.colorado.phet.geneexpressionbasics.common.model;
//
//import java.awt.geom.Point2D;
//import java.util.HashMap;
//import java.util.Map;
//
//import edu.colorado.phet.common.phetcommon.math.vector.Vector2D;
//import edu.colorado.phet.common.phetcommon.model.property.BooleanProperty;
//import edu.colorado.phet.common.phetcommon.util.SimpleObserver;
//import edu.colorado.phet.common.phetcommon.view.util.DoubleGeneralPath;
//import edu.colorado.phet.geneexpressionbasics.common.model.attachmentstatemachines.AttachmentStateMachine;
//import edu.colorado.phet.geneexpressionbasics.common.model.attachmentstatemachines.MessengerRnaAttachmentStateMachine;
//
///**
// * Class that represents messenger ribonucleic acid, or mRNA, in the model.
// * This class is fairly complex, due to the need for mRNA to wind up and
// * unwind as it is transcribed, translated, and destroyed.
// *
// * @author John Blanco
// */
//public class MessengerRna extends WindingBiomolecule {
//
//    //-------------------------------------------------------------------------
//    // Class Data
//    //-------------------------------------------------------------------------
//
//    // Length of the "leader segment", which is the portion of the mRNA that
//    // sticks out on the upper left side so that a ribosome can be attached.
//    public static final double LEADER_LENGTH = INTER_POINT_DISTANCE * 2;
//
//    // Distance within which this will connect to a ribosome.
//    private static final double RIBOSOME_CONNECTION_DISTANCE = 400; // picometers
//    private static final double MRNA_DESTROYER_CONNECT_DISTANCE = 400; // picometers
//
//    //-------------------------------------------------------------------------
//    // Instance Data
//    //-------------------------------------------------------------------------
//
//    public final PlacementHint ribosomePlacementHint;
//    public final PlacementHint mRnaDestroyerPlacementHint;
//
//    // Externally visible indicator for whether this mRNA is being synthesized.
//    // Assumes that it is being synthesized when created.
//    public final BooleanProperty beingSynthesized = new BooleanProperty( true );
//
//    // Map from ribosomes to the shape segment to which they are attached.
//    private final Map<Ribosome, ShapeSegment> mapRibosomeToShapeSegment = new HashMap<Ribosome, ShapeSegment>();
//
//    // mRNA destroyer that is destroying this mRNA.  Null until and unless
//    // destruction has begun.
//    private MessengerRnaDestroyer messengerRnaDestroyer = null;
//
//    // Shape segment where the mRNA destroyer is connected.  This is null until
//    // and unless destruction has begun.
//    private ShapeSegment segmentWhereDestroyerConnects = null;
//
//    // Protein prototype, used to keep track of protein that should be
//    // synthesized from this particular strand of mRNA.
//    private final Protein proteinPrototype;
//
//    // Local reference to the non-generic state machine used by this molecule.
//    private final MessengerRnaAttachmentStateMachine mRnaAttachmentStateMachine;
//
//    //-------------------------------------------------------------------------
//    // Constructor(s)
//    //-------------------------------------------------------------------------
//
//    /**
//     * Constructor.  This creates the mRNA as a single point, with the intention
//     * of growing it.
//     *
//     * @param position
//     */
//    public MessengerRna( final GeneExpressionModel model, Protein proteinPrototype, Vector2D position ) {
//        super( model, new DoubleGeneralPath( position.toPoint2D() ).getGeneralPath(), position );
//        this.proteinPrototype = proteinPrototype;
//        mRnaAttachmentStateMachine = (MessengerRnaAttachmentStateMachine) super.attachmentStateMachine;
//
//        // Add the first segment to the shape segment list.  This segment will
//        // contain the "leader" for the mRNA.
//        shapeSegments.add( new ShapeSegment.FlatSegment( position ) {{
//            setCapacity( LEADER_LENGTH );
//        }} );
//
//        // Add the placement hints for the locations where the user can attach
//        // a ribosome or an mRNA destroyer.
//        ribosomePlacementHint = new PlacementHint( new Ribosome( model ) );
//        mRnaDestroyerPlacementHint = new PlacementHint( new MessengerRnaDestroyer( model ) );
//        shapeProperty.addObserver( new SimpleObserver() {
//            public void update() {
//                // This hint always sits at the beginning of the RNA strand.
//                Vector2D currentMRnaFirstPointPosition = new Vector2D( firstShapeDefiningPoint.getPosition() );
//                ribosomePlacementHint.setPosition( currentMRnaFirstPointPosition.minus( Ribosome.OFFSET_TO_TRANSLATION_CHANNEL_ENTRANCE ) );
//                mRnaDestroyerPlacementHint.setPosition( currentMRnaFirstPointPosition );
//            }
//        } );
//    }
//
//    //-------------------------------------------------------------------------
//    // Methods
//    //-------------------------------------------------------------------------
//
//    @Override public void translate( Vector2D translationVector ) {
//        // Translate the current shape user the superclass facility.
//        super.translate( translationVector );
//        // Translate each of the shape segments that define the outline shape.
//        for ( ShapeSegment shapeSegment : shapeSegments ) {
//            shapeSegment.translate( translationVector );
//        }
//        // Translate each of the points that define the curly mRNA shape.
//        PointMass thisPoint = firstShapeDefiningPoint;
//        while ( thisPoint != null ) {
//            thisPoint.translate( translationVector );
//            thisPoint = thisPoint.getNextPointMass();
//        }
//    }
//
//    /**
//     * Command this mRNA strand to fade away when it has become fully formed.
//     * This was created for use in the 2nd tab, where mRNA is never translated
//     * once it is produced.
//     */
//    public void setFadeAwayWhenFormed( boolean fadeAwayWhenFormed ) {
//        // Just pass this through to the state machine.
//        mRnaAttachmentStateMachine.setFadeAwayWhenFormed( fadeAwayWhenFormed );
//    }
//
//    /**
//     * Advance the translation of the mRNA through the given ribosome by the
//     * specified length.  The given ribosome must already be attached to the
//     * mRNA.
//     *
//     * @param ribosome - The ribosome by which the mRNA is being translated.
//     * @param length   - The amount of mRNA to move through the translation channel.
//     * @return - true if the mRNA is completely through the channel, indicating,
//     *         that transcription is complete, and false if not.
//     */
//    public boolean advanceTranslation( Ribosome ribosome, double length ) {
//
//        ShapeSegment segmentToAdvance = mapRibosomeToShapeSegment.get( ribosome );
//
//        // Error checking.
//        assert segmentToAdvance != null; // Should never happen, since it means that the ribosome isn't attached.
//
//        // Advance the translation by advancing the position of the mRNA in the
//        // segment that corresponds to the translation channel of the ribosome.
//        segmentToAdvance.advance( length, shapeSegments );
//
//        // Realign the segments, since they may well have changed shape.
//        if ( shapeSegments.contains( segmentToAdvance ) ) {
//            realignSegmentsFrom( segmentToAdvance );
//        }
//
//        // Since the sizes and relationships of the segments probably changed,
//        // the winding algorithm needs to be rerun.
//        windPointsThroughSegments();
//
//        // If there is anything left in this segment, then transcription is not
//        // yet complete.
//        return segmentToAdvance.getContainedLength() <= 0;
//    }
//
//    /**
//     * Advance the destruction of the mRNA by the specified length.  This pulls
//     * the strand into the lead segment much like translation does, but does
//     * not move the points into new segment, it just gets rid of them.
//     *
//     * @param length
//     */
//    public boolean advanceDestruction( double length ) {
//
//        // Error checking.
//        if ( segmentWhereDestroyerConnects == null ) {
//            System.out.println( getClass().getName() + " - Warning: Attempt to advance the destruction of mRNA that has no content left." );
//            return true;
//        }
//
//        // Advance the destruction by reducing the length of the mRNA.
//        reduceLength( length );
//
//        // Realign the segments, since they may well have changed shape.
//        if ( shapeSegments.contains( segmentWhereDestroyerConnects ) ) {
//            realignSegmentsFrom( segmentWhereDestroyerConnects );
//        }
//
//        if ( shapeSegments.size() > 0 ) {
//            // Since the sizes and relationships of the segments probably changed,
//            // the winding algorithm needs to be rerun.
//            windPointsThroughSegments();
//        }
//
//        // If there is any length left, then the destruction is not yet
//        // complete.  This is a quick way to test this.
//        return firstShapeDefiningPoint == lastShapeDefiningPoint;
//    }
//
//    // Reduce the length of the mRNA.  This handles both the shape segments and
//    // the shape-defining points.
//    private void reduceLength( double reductionAmount ) {
//        if ( reductionAmount >= getLength() ) {
//            // Reduce length to be zero.
//            lastShapeDefiningPoint = firstShapeDefiningPoint;
//            lastShapeDefiningPoint.setNextPointMass( null );
//            shapeSegments.clear();
//        }
//        else {
//            // Remove the length from the shape segments.
//            segmentWhereDestroyerConnects.advanceAndRemove( reductionAmount, shapeSegments );
//            // Remove the length from the shape defining points.
//            for ( double amountRemoved = 0; amountRemoved < reductionAmount; ) {
//                if ( lastShapeDefiningPoint.getTargetDistanceToPreviousPoint() <= reductionAmount - amountRemoved ) {
//                    // Remove the last point from the list.
//                    amountRemoved += lastShapeDefiningPoint.getTargetDistanceToPreviousPoint();
//                    lastShapeDefiningPoint = lastShapeDefiningPoint.getPreviousPointMass();
//                    lastShapeDefiningPoint.setNextPointMass( null );
//                }
//                else {
//                    // Reduce the distance of the last point from the previous point.
//                    lastShapeDefiningPoint.setTargetDistanceToPreviousPoint( lastShapeDefiningPoint.getTargetDistanceToPreviousPoint() - ( reductionAmount - amountRemoved ) );
//                    amountRemoved = reductionAmount;
//                }
//            }
//        }
//    }
//
//    /**
//     * Create a new version of the protein that should result when this strand
//     * of mRNA is translated.
//     *
//     * @return
//     */
//    public Protein getProteinPrototype() {
//        return proteinPrototype;
//    }
//
//    /**
//     * Get the point in model space where the entrance of the given ribosome's
//     * translation channel should be in order to be correctly attached to
//     * this strand of messenger RNA.  This allows the ribosome to "follow" the
//     * mRNA if it is moving or changing shape.
//     *
//     * @param ribosome
//     * @return
//     */
//    public Vector2D getRibosomeAttachmentLocation( Ribosome ribosome ) {
//        if ( !mapRibosomeToShapeSegment.containsKey( ribosome ) ) {
//            System.out.println( getClass().getName() + " Warning: Ignoring attempt to obtain attachment point for non-attached ribosome." );
//            return null;
//        }
//        Vector2D attachmentPoint;
//        ShapeSegment segment = mapRibosomeToShapeSegment.get( ribosome );
//        if ( shapeSegments.getPreviousItem( segment ) == null ) {
//            // There is no previous segment, which means that the segment to
//            // which this ribosome is attached is the leader segment.  The
//            // attachment point is thus the leader length from its rightmost
//            // edge.
//            attachmentPoint = new Vector2D( segment.getLowerRightCornerPos().getX() - LEADER_LENGTH, segment.getLowerRightCornerPos().getY() );
//        }
//        else {
//            // The segment has filled up the channel, so calculate the
//            // position based on its left edge.
//            attachmentPoint = new Vector2D( segment.getUpperLeftCornerPos().getX() + ribosome.getTranslationChannelLength(),
//                                            segment.getUpperLeftCornerPos().getY() );
//        }
//        return attachmentPoint;
//    }
//
//    /**
//     * Release this mRNA from a ribosome.  If this is the only ribosome to
//     * which the mRNA is connected, the mRNA will start wandering.
//     *
//     * @param ribosome
//     */
//    public void releaseFromRibosome( Ribosome ribosome ) {
//        assert mapRibosomeToShapeSegment.containsKey( ribosome ); // This shouldn't be called if the ribosome wasn't connected.
//        mapRibosomeToShapeSegment.remove( ribosome );
//        if ( mapRibosomeToShapeSegment.isEmpty() ) {
//            mRnaAttachmentStateMachine.allRibosomesDetached();
//        }
//    }
//
//    /**
//     * Release this mRNA from the polymerase which is, presumably, transcribing
//     * it.
//     */
//    public void releaseFromPolymerase() {
//        mRnaAttachmentStateMachine.detach();
//    }
//
//    /**
//     * Activate the placement hint(s) as appropriate for the given biomolecule.
//     *
//     * @param biomolecule - And instance of the type of biomolecule for which
//     *                    any matching hints should be activated.
//     */
//    public void activateHints( MobileBiomolecule biomolecule ) {
//        ribosomePlacementHint.activateIfMatch( biomolecule );
//        mRnaDestroyerPlacementHint.activateIfMatch( biomolecule );
//    }
//
//    public void deactivateAllHints() {
//        ribosomePlacementHint.active.set( false );
//        mRnaDestroyerPlacementHint.active.set( false );
//    }
//
//    /**
//     * Initiate the translation process by setting up the segments as needed.
//     * This should only be called after a ribosome that was moving to attach
//     * with this mRNA arrives at the attachment point.
//     *
//     * @param ribosome
//     */
//    public void initiateTranslation( Ribosome ribosome ) {
//        assert mapRibosomeToShapeSegment.containsKey( ribosome ); // State checking.
//
//        // Set the capacity of the first segment to the size of the channel
//        // through which it will be pulled plus the leader length.
//        ShapeSegment firstShapeSegment = shapeSegments.get( 0 );
//        assert firstShapeSegment.isFlat();
//        firstShapeSegment.setCapacity( ribosome.getTranslationChannelLength() + LEADER_LENGTH );
//    }
//
//    /**
//     * Initiate the destruction of this mRNA strand by setting up the segments
//     * as needed.  This should only be called after an mRNA destroyer has
//     * attached to the front of the mRNA strand.  Once initiated, destruction
//     * cannot be stopped.
//     *
//     * @param messengerRnaDestroyer
//     */
//    public void initiateDestruction( MessengerRnaDestroyer messengerRnaDestroyer ) {
//        assert this.messengerRnaDestroyer == messengerRnaDestroyer; // Shouldn't get this from unattached destroyers.
//
//        // Set the capacity of the first segment to the size of the channel
//        // through which it will be pulled plus the leader length.
//        segmentWhereDestroyerConnects = shapeSegments.get( 0 );
//        assert segmentWhereDestroyerConnects.isFlat();
//        segmentWhereDestroyerConnects.setCapacity( messengerRnaDestroyer.getDestructionChannelLength() + LEADER_LENGTH );
//    }
//
//    /**
//     * Get the proportion of the entire mRNA that has been translated by the
//     * given ribosome.
//     *
//     * @param ribosome
//     * @return
//     */
//    public double getProportionOfRnaTranslated( Ribosome ribosome ) {
//        assert mapRibosomeToShapeSegment.containsKey( ribosome ); // Makes no sense if ribosome isn't attached.
//
//        double translatedLength = 0;
//
//        ShapeSegment segmentInRibosomeChannel = mapRibosomeToShapeSegment.get( ribosome );
//        assert segmentInRibosomeChannel.isFlat(); // Make sure things are as we expect.
//
//        // Add the length for each segment that precedes this ribosome.
//        for ( ShapeSegment shapeSegment : shapeSegments ) {
//            if ( shapeSegment == segmentInRibosomeChannel ) {
//                break;
//            }
//            translatedLength += shapeSegment.getContainedLength();
//        }
//
//        // Add the length for the segment that is inside the translation
//        // channel of this ribosome.
//        translatedLength += segmentInRibosomeChannel.getContainedLength() - ( segmentInRibosomeChannel.getLowerRightCornerPos().getX() - segmentInRibosomeChannel.attachmentSite.locationProperty.get().getX() );
//
//        return Math.max( translatedLength / getLength(), 0 );
//    }
//
//    public AttachmentSite considerProposalFrom( Ribosome ribosome ) {
//        assert !mapRibosomeToShapeSegment.containsKey( ribosome ); // Shouldn't get redundant proposals from a ribosome.
//        AttachmentSite returnValue = null;
//
//        // Can't consider proposal if currently being destroyed.
//        if ( messengerRnaDestroyer == null ) {
//            // See if the attachment site at the leading edge of the mRNA is
//            // available.
//            AttachmentSite leadingEdgeAttachmentSite = shapeSegments.get( 0 ).attachmentSite;
//            if ( leadingEdgeAttachmentSite.attachedOrAttachingMolecule.get() == null &&
//                 leadingEdgeAttachmentSite.locationProperty.get().distance( ribosome.getEntranceOfRnaChannelPos().toPoint2D() ) < RIBOSOME_CONNECTION_DISTANCE ) {
//                // This attachment site is in range and available.
//                returnValue = leadingEdgeAttachmentSite;
//                // Update the attachment state machine.
//                mRnaAttachmentStateMachine.attachedToRibosome();
//                // Enter this connection in the map.
//                mapRibosomeToShapeSegment.put( ribosome, shapeSegments.get( 0 ) );
//            }
//        }
//
//        return returnValue;
//    }
//
//    public AttachmentSite considerProposalFrom( MessengerRnaDestroyer messengerRnaDestroyer ) {
//
//        assert this.messengerRnaDestroyer != messengerRnaDestroyer; // Shouldn't get redundant proposals from same destroyer.
//        AttachmentSite returnValue = null;
//
//        // Make sure that this mRNA is not already being destroyed.
//        if ( this.messengerRnaDestroyer == null ) {
//            // See if the attachment site at the leading edge of the mRNA is
//            // available.
//            AttachmentSite leadingEdgeAttachmentSite = shapeSegments.get( 0 ).attachmentSite;
//            if ( leadingEdgeAttachmentSite.attachedOrAttachingMolecule.get() == null &&
//                 leadingEdgeAttachmentSite.locationProperty.get().distance( messengerRnaDestroyer.getPosition() ) < MRNA_DESTROYER_CONNECT_DISTANCE ) {
//                // This attachment site is in range and available.
//                returnValue = leadingEdgeAttachmentSite;
//                // Update the attachment state machine.
//                mRnaAttachmentStateMachine.attachToDestroyer();
//                // Keep track of the destroyer.
//                this.messengerRnaDestroyer = messengerRnaDestroyer;
//            }
//        }
//
//        return returnValue;
//    }
//
//    /*
//     * Aborts the destruction process, used if the mRNA destroyer was on its
//     * way to the mRNA but the user picked it up before it got there.
//     */
//    public void abortDestruction() {
//        messengerRnaDestroyer = null;
//        attachmentStateMachine.forceImmediateUnattachedAndAvailable();
//    }
//
//    @Override protected AttachmentStateMachine createAttachmentStateMachine() {
//        return new MessengerRnaAttachmentStateMachine( this );
//    }
//
//    public Point2D getDestroyerAttachmentLocation() {
//        assert segmentWhereDestroyerConnects != null; // State checking - shouldn't be called before this is set.
//        // Avoid null pointer exception.
//        if ( segmentWhereDestroyerConnects == null ) {
//            return new Point2D.Double( 0, 0 );
//        }
//        // The attachment location is at the right most side of the segment
//        // minus the leader length.
//        return new Point2D.Double( segmentWhereDestroyerConnects.getLowerRightCornerPos().getX() - LEADER_LENGTH,
//                                   segmentWhereDestroyerConnects.getLowerRightCornerPos().getY() );
//    }
//}
