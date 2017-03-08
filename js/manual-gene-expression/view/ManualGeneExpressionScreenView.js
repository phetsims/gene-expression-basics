// Copyright 2015, University of Colorado Boulder

/**
 * @author Sharfudeen Ashraf
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  // modules
  var ArrowNode = require( 'SCENERY_PHET/ArrowNode' );
  var geneExpressionEssentials = require( 'GENE_EXPRESSION_ESSENTIALS/geneExpressionEssentials' );
  var HBox = require( 'SCENERY/nodes/HBox' );
  var inherit = require( 'PHET_CORE/inherit' );
  var ScreenView = require( 'JOIST/ScreenView' );
  var Node = require( 'SCENERY/nodes/Node' );
  var PlacementHintNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/PlacementHintNode' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var MobileBiomoleculeNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/MobileBiomoleculeNode' );
  var ProteinCollectionNode = require( 'GENE_EXPRESSION_ESSENTIALS/manual-gene-expression/view/ProteinCollectionNode' );
  var BiomoleculeToolBoxNode = require( 'GENE_EXPRESSION_ESSENTIALS/manual-gene-expression/view/BiomoleculeToolBoxNode' );
  var DnaMoleculeNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/DnaMoleculeNode' );
  //var DnaMoleculeCanvasNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/DnaMoleculeCanvasNode' );
  var MessengerRnaNode = require( 'GENE_EXPRESSION_ESSENTIALS/common/view/MessengerRnaNode' );
  var Vector2 = require( 'DOT/Vector2' );
  var ModelViewTransform2 = require( 'PHETCOMMON/view/ModelViewTransform2' );
  var RectangularPushButton = require( 'SUN/buttons/RectangularPushButton' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var Text = require( 'SCENERY/nodes/Text' );

  // constants
  var GENE_TO_GENE_ANIMATION_TIME = 1000; // In milliseconds.
  // Inset for several of the controls.
  var INSET = 15;

  // strings
  var nextGeneString = require( 'string!GENE_EXPRESSION_ESSENTIALS/nextGene' );
  var previousGeneString = require( 'string!GENE_EXPRESSION_ESSENTIALS/previousGene' );

  /**
   * @param {ManualGeneExpressionModel} model
   * @constructor
   */
  function ManualGeneExpressionScreenView( model ) {

    ScreenView.call( this );
    var self = this;

    this.viewPortOffset = new Vector2( 0, 0 );
    var biomoleculeToolBoxNodeList = []; // Array of BiomoleculeToolBoxNode
    // Set up the model-canvas transform.
    // IMPORTANT NOTES: The multiplier factors for the 2nd point can be
    // adjusted to shift the center right or left, and the scale factor
    // can be adjusted to zoom in or out (smaller numbers zoom out, larger
    // ones zoom in).
    this.mvt = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      Vector2.ZERO,
      new Vector2( self.layoutBounds.width * 0.48, self.layoutBounds.height * 0.64 ),
      0.1 ); // "Zoom factor" - smaller zooms out, larger zooms in.

    // Set up the node where all controls that need to be below the
    // biomolecules should be placed.  This node and its children will
    // stay in one place and not scroll.
    var backControlsLayer = new Node();
    self.addChild( backControlsLayer );

    // Set up the root node for all model objects.  Nodes placed under
    // this one will scroll when the user moves along the DNA strand.
    this.modelRootNode = new Node();
    self.addChild( this.modelRootNode );


    // Add some layers for enforcing some z-order relationships needed in
    // order to keep things looking good.
    var dnaLayer = new Node();
    this.modelRootNode.addChild( dnaLayer );
    var biomoleculeToolBoxLayer = new Node();
    this.modelRootNode.addChild( biomoleculeToolBoxLayer );
    var messengerRnaLayer = new Node();
    this.modelRootNode.addChild( messengerRnaLayer );
    var topBiomoleculeLayer = new Node();
    this.modelRootNode.addChild( topBiomoleculeLayer );
    var placementHintLayer = new Node();
    this.modelRootNode.addChild( placementHintLayer );

    // Set up the node where all controls that need to be above the
    // biomolecules should be placed.  This node and its children will
    // stay in one place and not scroll.
    var frontControlsLayer = new Node();
    self.addChild( frontControlsLayer );

    // Add the representation of the DNA strand.
    this.dnaMoleculeNode = new DnaMoleculeNode( model.getDnaMolecule(), self.mvt, 3, true );
    dnaLayer.addChild( this.dnaMoleculeNode );

    // Add the placement hints that go on the DNA molecule.  These exist on
    // their own layer so that they can be seen above any molecules that
    // are attached to the DNA strand.
    _.each( model.getDnaMolecule().getGenes(), function( gene ) {
      _.each( gene.getPlacementHints(), function( placementHint ) {
        placementHintLayer.addChild( new PlacementHintNode( self.mvt, placementHint ) );
      } );
    } );

    // this.debugPoint( thisView, new Vector2( 0, 0 ) );

    // Add the protein collection box.
    var proteinCollectionNode = new ProteinCollectionNode( model, this.mvt );
    proteinCollectionNode.x = self.layoutBounds.width - proteinCollectionNode.bounds.width - INSET;
    proteinCollectionNode.y = INSET;
    backControlsLayer.addChild( proteinCollectionNode );

    // Add any initial molecules.
    _.each( model.mobileBiomoleculeList, function( biomolecule ) {
      topBiomoleculeLayer.addChild( new MobileBiomoleculeNode( self.mvt, biomolecule ) );
    } );

    // Watch for and handle comings and goings of biomolecules in the model. Most, but not all, of the biomolecules
    // are handled by this.  Some  others are handled as special cases.
    model.mobileBiomoleculeList.addItemAddedListener( function( addedBiomolecule ) {
      var biomoleculeNode = new MobileBiomoleculeNode( self.mvt, addedBiomolecule );
      topBiomoleculeLayer.addChild( biomoleculeNode );

      function removeItemListener( removedBiomolecule ) {
        if ( removedBiomolecule === addedBiomolecule ) {
          topBiomoleculeLayer.removeChild( biomoleculeNode );
          model.mobileBiomoleculeList.removeItemRemovedListener( removeItemListener );// Clean up memory leak
        }
      }

      model.mobileBiomoleculeList.addItemRemovedListener( removeItemListener );

    } );

    // Watch for and handle comings and goings of messenger RNA.
    model.messengerRnaList.addItemAddedListener( function( addedMessengerRna ) {

      var messengerRnaNode = new MessengerRnaNode( self.mvt, addedMessengerRna );
      messengerRnaLayer.addChild( messengerRnaNode );

      function removeItemListener( removedMessengerRna ) {
        if ( removedMessengerRna === addedMessengerRna ) {
          messengerRnaLayer.removeChild( messengerRnaNode );
          model.messengerRnaList.removeItemRemovedListener( removeItemListener );// Clean up memory leak
        }
      }

      model.messengerRnaList.addItemRemovedListener( removeItemListener );

    } );


    // Add the tool boxes from which the various biomolecules can be moved  into the active area of the sim.
    _.each( model.getDnaMolecule().getGenes(), function( gene ) {
      var biomoleculeToolBoxNode = new BiomoleculeToolBoxNode( model, self, self.mvt, gene );
      biomoleculeToolBoxNode.x = self.mvt.modelToViewX( gene.getCenterX() ) - self.layoutBounds.getWidth() / 2 + INSET;
      biomoleculeToolBoxNode.y = INSET;
      biomoleculeToolBoxNodeList.push( biomoleculeToolBoxNode );
      biomoleculeToolBoxLayer.addChild( biomoleculeToolBoxNode );
      model.addOffLimitsMotionSpace( self.mvt.viewToModelBounds( biomoleculeToolBoxNode.bounds ) );
    } );


    // Add buttons for moving to next and previous genes.
    var nextGeneButtonContent = new HBox({
      children: [
        new Text( nextGeneString, {
          font: new PhetFont( { size: 18 } ),
          maxWidth: 120
        } ),
        new ArrowNode( 0, 0, 20, 0, {
          headHeight: 8,
          headWidth: 10,
          tailWidth: 5
        } )
      ],
      spacing: 5
    });
    var nextGeneButton = new RectangularPushButton( {
      content: nextGeneButtonContent,
      listener: function() {
        model.nextGene() ;
      },
      baseColor: 'yellow',
      //fireOnDown: true,
      stroke: 'black',
      lineWidth: 1
    } );

    nextGeneButton.x = self.layoutBounds.width - nextGeneButton.width - 20;
    nextGeneButton.y = self.mvt.modelToViewY( model.getDnaMolecule().getLeftEdgePos().y ) + 90;

    // Add buttons for moving to next and previous genes.
    var previousGeneButtonContent = new HBox({
      children: [
        new ArrowNode( 0, 0, -20, 0, {
          headHeight: 8,
          headWidth: 10,
          tailWidth: 5
        } ),
        new Text( previousGeneString, {
          font: new PhetFont( { size: 18 } ),
          maxWidth: 120
        } )
      ],
      spacing: 5
    });
    var previousGeneButton = new RectangularPushButton( {
      content: previousGeneButtonContent,
      listener: function() {
        model.previousGene() ;
      },
      baseColor: 'yellow',
      stroke: 'black',
      lineWidth: 1
    } );

    previousGeneButton.x = 20;
    previousGeneButton.y = self.mvt.modelToViewY( model.getDnaMolecule().getLeftEdgePos().y ) + 90;

    // set the position of model root node based on first gene
    self.modelRootNode.x = -self.mvt.modelToViewX( model.dnaMolecule.getGenes()[ 0 ].getCenterX() )
                           + self.layoutBounds.width / 2;

    var modelRootNodeAnimator = new TWEEN.Tween( { x: self.modelRootNode.x } ).easing( TWEEN.Easing.Cubic.InOut ).onUpdate( function() {
      self.modelRootNode.x = this.x;
    } ).onComplete( function() {
      self.modelRootNode.visible = true;
      self.modelRootNode.pickable = null;
      var boundsInControlNode = proteinCollectionNode.getBounds().copy();
      var boundsAfterTransform = boundsInControlNode.transform( self.modelRootNode.getTransform().getInverse() );
      var boundsInModel = self.mvt.viewToModelBounds( boundsAfterTransform );

      model.setProteinCaptureArea( boundsInModel );
      model.addOffLimitsMotionSpace( boundsInModel );

    } );
    // Monitor the active gene and move the view port to be centered on it whenever it changes.

    model.activeGeneProperty.link( function( gene ) {
      nextGeneButton.enabled = !( gene === model.dnaMolecule.getLastGene() );
      previousGeneButton.enabled = !( gene === model.dnaMolecule.getGenes()[ 0 ] );
      self.viewPortOffset.setXY( -self.mvt.modelToViewX( gene.getCenterX() ) + self.layoutBounds.width / 2, 0 );
      modelRootNodeAnimator.stop().to( { x: self.viewPortOffset.x }, GENE_TO_GENE_ANIMATION_TIME ).start( phet.joist.elapsedTime );
    } );



    frontControlsLayer.addChild( nextGeneButton );
    frontControlsLayer.addChild( previousGeneButton );


    // Create and add the Reset All Button in the bottom right, which resets the model
    var resetAllButton = new ResetAllButton( {
      listener: function() {
        model.reset();
        biomoleculeToolBoxNodeList.forEach( function( biomoleculeToolBoxNode ){
          biomoleculeToolBoxNode.reset();
        });
      },
      right:  this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10
    } );
    frontControlsLayer.addChild( resetAllButton );
  }

  geneExpressionEssentials.register( 'ManualGeneExpressionScreenView', ManualGeneExpressionScreenView );

  return inherit( ScreenView, ManualGeneExpressionScreenView, {
    step: function() {
      this.dnaMoleculeNode.step();
    }
  } );
} );