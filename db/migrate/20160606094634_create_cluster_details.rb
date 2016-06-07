class CreateClusterDetails < ActiveRecord::Migration
  def change
    create_table :cluster_details do |t|
      t.references :cluster
      t.references :server
      t.references :node_role
      t.timestamps null: false
    end
  end
end
