//  Copyright 2002-2014, University of Colorado Boulder
/**
 * Motion strategy that tracks an attachment site and moves to wherever it is.
 *
 * @author John Blanco
 * @author Mohamed Safi
 *
 */
define( function( require ) {
  'use strict';

  //modules
  var inherit = require( 'PHET_CORE/inherit' );
  var MotionStrategy = require( 'GENE_EXPRESSION_BASICS/common/model/motionstrategies/MotionStrategy' );

  /**
   * @param {AttachmentSite} attachmentSite
   * @constructor
   */
  function FollowAttachmentSite( attachmentSite ) {
    MotionStrategy.call( this );
    this.attachmentSite = attachmentSite;
  }

  return inherit( MotionStrategy, FollowAttachmentSite, {

    /**
     * @Override
     * @param {Vector2} currentLocation
     * @param {Shape} shape
     * @param {number} dt
     * @returns {Vector2}
     */
    getNextLocation: function( currentLocation, shape, dt ) {
      return this.attachmentSite.location;
    }

  } );

} );
