//  Copyright 2002-2014, University of Colorado Boulder
/**
 * This class defines a point in model space that also has mass.  It is
 * is used to define the overall shape of the mRNA, which uses a spring
 * algorithm to implement the winding/twisting behavior.
 *
 *@author John Blanco
 * @author Mohamed Safi
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Vector2 = require( 'DOT/Vector2' );

  //constants
  var MASS = 0.25; // In kg.  Arbitrarily chosen to get the desired behavior.


  /**
   *
   * @param {Vector2} initialPosition
   * @param {number} targetDistanceToPreviousPoint
   * @constructor
   */
  function PointMass( initialPosition, targetDistanceToPreviousPoint ) {
    this.setPosition( initialPosition );
    this.targetDistanceToPreviousPoint = targetDistanceToPreviousPoint;// In picometers.

    // private
    this.position = new Vector2( 0, 0 );
    this.velocity = new Vector2( 0, 0 );
    this.acceleration = new Vector2( 0, 0 );
    this.previousPointMass = null;
    this.nextPointMass = null;

  }

  return inherit( Object, PointMass, {

    /**
     * @returns {string}
     */
    toString: function() { //TODO
      return " Position: " + this.position.toString();
    },


    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition: function( x, y ) {
      this.position.setLocation( x, y );
    },

    /**
     * @param {Vector2} position
     */
    setPositionByVector: function( position ) {
      this.setPosition( position.x, position.y );
    },

    /**
     * @returns {Vector2}
     */
    getPosition: function() {
      return new Vector2( this.position.x, this.position.getY() );
    },

    /**
     * @param {Vector2} velocity
     * @returns {Vector2}
     */
    getVelocity: function( velocity ) {
      return new Vector2( velocity.x, velocity.y );
    },

    /**
     * @param {Vector2} acceleration
     */
    setAcceleration: function( acceleration ) {
      this.acceleration.setValue( acceleration );
    },

    /**
     * @returns {PointMass}
     */
    getPreviousPointMass: function() {
      return this.previousPointMass;
    },

    /**
     * @param {PointMass} previousPointMass
     */
    setPreviousPointMass: function( previousPointMass ) {
      this.previousPointMass = previousPointMass;
    },

    /**
     * @returns {PointMass}
     */
    getNextPointMass: function() {
      return this.nextPointMass;
    },

    /**
     * @param {PointMass} nextPointMass
     */
    setNextPointMass: function( nextPointMass ) {
      this.nextPointMass = nextPointMass;
    },

    /**
     * @returns {number}
     */
    getTargetDistanceToPreviousPoint: function() {
      return this.targetDistanceToPreviousPoint;
    },

    /**
     * @param {PointMass} p
     * @returns {number}
     */
    distance: function( p ) {
      return this.getPosition().distance( p.getPosition() );
    },

    /**
     * @param {number} deltaTime
     */
    update: function( deltaTime ) {
      this.velocity.setValue( this.velocity.plus( this.acceleration.times( deltaTime ) ) );
      this.position.setLocation( this.position.x + this.velocity.x * deltaTime, this.position.y + this.velocity.y * deltaTime );
    },

    translate: function( translationVector ) {
      this.setPosition( this.position.x + translationVector.x, this.position.y + translationVector.getY() );
    },

    /**
     * @param {number} targetDistance
     */
    setTargetDistanceToPreviousPoint: function( targetDistance ) {
      this.targetDistanceToPreviousPoint = targetDistance;
    },


    clearVelocity: function() {
      this.velocity.setComponents( 0, 0 );
    }

  }, {

    MASS: MASS
  } );


} );
//// Copyright 2002-2012, University of Colorado
//package edu.colorado.phet.geneexpressionbasics.common.model;
//
//import java.awt.geom.Point2D;
//
//import edu.colorado.phet.common.phetcommon.math.vector.MutableVector2D;
//import edu.colorado.phet.common.phetcommon.math.vector.Vector2D;
//
///**
// * This class defines a point in model space that also has mass.  It is
// * is used to define the overall shape of the mRNA, which uses a spring
// * algorithm to implement the winding/twisting behavior.
// */
//public class PointMass {
//    public static final double MASS = 0.25; // In kg.  Arbitrarily chosen to get the desired behavior.
//    private final Point2D position = new Point2D.Double( 0, 0 );
//    private final MutableVector2D velocity = new MutableVector2D( 0, 0 );
//    private final MutableVector2D acceleration = new MutableVector2D( 0, 0 );
//    private PointMass previousPointMass = null;
//    private PointMass nextPointMass = null;
//
//    private double targetDistanceToPreviousPoint; // In picometers.
//
//    public PointMass( Vector2D initialPosition, double targetDistanceToPreviousPoint ) {
//        setPosition( initialPosition );
//        this.targetDistanceToPreviousPoint = targetDistanceToPreviousPoint;
//    }
//
//    @Override public String toString() {
//        return getClass().getName() + " Position: " + position.toString();
//    }
//
//    public void setPosition( double x, double y ) {
//        position.setLocation( x, y );
//    }
//
//    public void setPosition( Vector2D position ) {
//        setPosition( position.getX(), position.getY() );
//    }
//
//    public Vector2D getPosition() {
//        return new Vector2D( position.getX(), position.getY() );
//    }
//
//    public Vector2D getVelocity() {
//        return new Vector2D( velocity.getX(), velocity.getY() );
//    }
//
//    public void setAcceleration( Vector2D acceleration ) {
//        this.acceleration.setValue( acceleration );
//    }
//
//    public PointMass getPreviousPointMass() {
//        return previousPointMass;
//    }
//
//    public void setPreviousPointMass( PointMass previousPointMass ) {
//        this.previousPointMass = previousPointMass;
//    }
//
//    public PointMass getNextPointMass() {
//        return nextPointMass;
//    }
//
//    public void setNextPointMass( PointMass nextPointMass ) {
//        this.nextPointMass = nextPointMass;
//    }
//
//    public double getTargetDistanceToPreviousPoint() {
//        return targetDistanceToPreviousPoint;
//    }
//
//    public double distance( PointMass p ) {
//        return this.getPosition().distance( p.getPosition() );
//    }
//
//    public void update( double deltaTime ) {
//        velocity.setValue( velocity.plus( acceleration.times( deltaTime ) ) );
//        position.setLocation( position.getX() + velocity.getX() * deltaTime, position.getY() + velocity.getY() * deltaTime );
//    }
//
//    public void translate( Vector2D translationVector ) {
//        setPosition( position.getX() + translationVector.getX(), position.getY() + translationVector.getY() );
//    }
//
//    public void setTargetDistanceToPreviousPoint( double targetDistance ) {
//        targetDistanceToPreviousPoint = targetDistance;
//    }
//
//    public void clearVelocity() {
//        velocity.setComponents( 0, 0 );
//    }
//}
