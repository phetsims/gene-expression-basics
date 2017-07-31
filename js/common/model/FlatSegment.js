// Copyright 2015, University of Colorado Boulder

/**
 * Flat segment is inherited from ShapeSegment and has no height, so mRNA contained in this segment is not wound.
 *
 * @author John Blanco
 * @author Mohamed Safi
 * @author Aadish Gupta
 */
define( function( require ) {
  'use strict';

  //modules
  var GEEConstants = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/GEEConstants' );
  var geneExpressionEssentials = require( 'GENE_EXPRESSION_ESSENTIALS/geneExpressionEssentials' );
  var inherit = require( 'PHET_CORE/inherit' );
  var ShapeSegment = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/ShapeSegment' );
  var SquareSegment = require( 'GENE_EXPRESSION_ESSENTIALS/common/model/SquareSegment' );

  /**
   * @param {Vector2} origin
   * @constructor
   */
  function FlatSegment( origin ) {
    ShapeSegment.call( this );
    this.bounds.setMinMax( origin.x, origin.y, origin.x, origin.y ); // make sure bounds height and width is zero
    this.updateAttachmentSiteLocation();
  }

  geneExpressionEssentials.register( 'FlatSegment', FlatSegment );

  return inherit( ShapeSegment, FlatSegment, {

    /**
     * @override
     * For a flat segment, the length of mRNA contained is equal to  the width.
     * @returns {number}
     * @public
     */
    getContainedLength: function() {
      return this.bounds.getWidth();
    },

    /**
     * @override
     * @param {number} length
     * @param {WindingBiomolecule} windingBiomolecule
     * @param {Array.<ShapeSegment>} shapeSegmentList
     * @public
     */
    add: function( length, windingBiomolecule, shapeSegmentList ) {

      // This shouldn't be called if there is no remaining capacity.
      assert && assert( this.getContainedLength() <= this.capacity );
      var growthAmount = length;
      if ( this.getContainedLength() + length > this.capacity ) {

        // This segment can't hold the specified length. Add a new square segment to the end of the segment list and put
        // the excess in there.
        var newSquareSegment = new SquareSegment( this.getLowerRightCornerPos() );
        growthAmount = this.capacity - this.getContainedLength(); // Clamp growth at remaining capacity.
        newSquareSegment.add( length - growthAmount, windingBiomolecule, shapeSegmentList );
        windingBiomolecule.insertAfterShapeSegment( this, newSquareSegment );
      }

      // Grow the bounds linearly to the left to accommodate the  additional length.
      this.bounds.setMinMax( this.bounds.x - growthAmount,
        this.bounds.y,
        this.bounds.x + this.bounds.getWidth(),
        this.bounds.y );
      this.updateAttachmentSiteLocation();
    },

    /**
     * @override
     * @param {number} length
     * @param {Array.<ShapeSegment>} shapeSegmentList
     * @public
     */
    remove: function( length, shapeSegmentList ) {
      this.bounds.setMinMax( this.bounds.x, this.bounds.y, this.bounds.x + this.bounds.getWidth() - length, this.bounds.y );

      // If the length has gotten to zero, remove this segment from  the list.
      if ( this.getContainedLength() < ShapeSegment.FLOATING_POINT_COMP_FACTOR ) {
        var index = shapeSegmentList.indexOf( this );
        shapeSegmentList.splice( index, 1 );
      }
      this.updateAttachmentSiteLocation();
    },

    /**
     * @override
     * @param {number} length
     * @param {WindingBiomolecule} windingBiomolecule
     * @param {Array.<ShapeSegment>} shapeSegmentList
     * @public
     */
    advance: function( length, windingBiomolecule, shapeSegmentList ) {
      var outputSegment = windingBiomolecule.getPreviousShapeSegment( this );
      var inputSegment = windingBiomolecule.getNextShapeSegment( this );
      if ( inputSegment === null ) {

        // There is no input segment, meaning that the end of the mRNA strand is contained in THIS segment, so this
        // segment needs to shrink.
        var lengthToAdvance = Math.min( length, this.getContainedLength() );
        this.remove( lengthToAdvance, shapeSegmentList );
        outputSegment.add( lengthToAdvance, windingBiomolecule, shapeSegmentList );
      }
      else if ( inputSegment.getContainedLength() > length ) {

        // The input segment contains enough mRNA length to supply this segment with the needed length.
        if ( this.getContainedLength() + length <= this.capacity ) {

          // The new length isn't enough to fill up this segment, so this segment just needs to grow.
          this.add( length, windingBiomolecule, shapeSegmentList );
        }
        else {
          // This segment is full or close enough to being full that it can't accommodate all of the specified length.
          // Some or all of that length must go in the output segment.
          var remainingCapacity = this.getRemainingCapacity();
          if ( remainingCapacity > ShapeSegment.FLOATING_POINT_COMP_FACTOR ) {

            // Not quite full yet - fill it up.
            this.maxOutLength();
            // This situation - one in which a segment that is having the mRNA advanced through it but it not yet full
            // should only occur when this segment is the first one on the shape segment list. So, add a new one to the
            // front of the segment list, but first, make sure there isn't something there already.

            assert && assert( outputSegment === null );

            var newLeaderSegment = new FlatSegment( this.getUpperLeftCornerPos() );
            newLeaderSegment.setCapacity( GEEConstants.LEADER_LENGTH );
            windingBiomolecule.insertBeforeShapeSegment( this, newLeaderSegment );
            outputSegment = newLeaderSegment;
          }
          // Add some or all of the length to the output segment.
          outputSegment.add( length - remainingCapacity, windingBiomolecule, shapeSegmentList );
        }
        // Remove the length from the input segment.
        inputSegment.remove( length, shapeSegmentList );
      }
      else {

        // The input segment is still around, but doesn't have the specified advancement length within it. Shrink it to
        // zero, which will remove it, and then shrink the advancing segment by the remaining amount.
        this.remove( length - inputSegment.getContainedLength(), shapeSegmentList );
        inputSegment.remove( inputSegment.getContainedLength(), shapeSegmentList );
        outputSegment.add( length, windingBiomolecule, shapeSegmentList );
      }
      this.updateAttachmentSiteLocation();
    },

    /**
     * @override
     * @param {number} length
     * @param {WindingBiomolecule} windingBiomolecule
     * @param {Array.<ShapeSegment>} shapeSegmentList
     * @public
     */
    advanceAndRemove: function( length, windingBiomolecule, shapeSegmentList ) {
      var inputSegment = windingBiomolecule.getNextShapeSegment( this );
      if ( inputSegment === null ) {

        // There is no input segment, meaning that the end of the mRNA strand is contained in THIS segment, so this
        // segment needs to shrink.
        var lengthToRemove = Math.min( length, this.getContainedLength() );
        this.remove( lengthToRemove, shapeSegmentList );
      }
      else if ( inputSegment.getContainedLength() > length ) {

        // The input segment contains enough mRNA to satisfy this request, so remove the length from there.
        inputSegment.remove( length, shapeSegmentList );
      }
      else {
        // The input segment is still around, but doesn't have enough mRNA within it. Shrink the input segment to zero
        // and then shrink this segment by the remaining amount.
        this.remove( length - inputSegment.getContainedLength(), shapeSegmentList );
        inputSegment.remove( inputSegment.getContainedLength(), shapeSegmentList );
      }
      this.updateAttachmentSiteLocation();
    },

    /**
     * Set size to be exactly the capacity. Do not create any new segments.
     * @private
     */
    maxOutLength: function() {
      var growthAmount = this.getRemainingCapacity();
      this.bounds.setMinMax( this.bounds.x - growthAmount,
        this.bounds.minY, this.bounds.x - growthAmount + this.capacity,
        this.bounds.minY );
      this.updateAttachmentSiteLocation();
    }
  } );
} );
